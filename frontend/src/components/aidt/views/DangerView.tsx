import DocumentMeta from '../shared/DocumentMeta';
import { RiskItem } from '../../../api/analyze';
import { mockDocumentContent } from '../../../mock/mockData';
import { useState, useMemo } from 'react';
import { MdError, MdWarning} from "react-icons/md";

import "./DangerView.css"

const normalizeRiskLevel = (level?: string): 'high' | 'medium' | 'low' => {
  const normalized = (level || '').toLowerCase();
  if (normalized === 'critical' || normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
};

// 공백/줄바꿈 정규화 — 매칭 비교용
const normalizeText = (text: string) =>
  text.replace(/\s+/g, ' ').replace(/\u00A0/g, ' ').trim();

interface DangerViewProps {
  currentDocument: {
    content: string;
    uploadDate: string;
    filename: string;
  };
  riskData: RiskItem[];
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  editedHtml?: string;
}

function DangerView({ 
  currentDocument,
  riskData,
  zoomLevel, 
  onZoomIn, 
  onZoomOut,
  editedHtml = '',
}: DangerViewProps) {

  // ── 블록 생성: 표는 그대로, 텍스트는 문단 단위로 ──
  const blocks = useMemo(() => {
    const result: { type: 'table' | 'text'; content: string; rawText: string }[] = [];
    const html = editedHtml || '';

    if (!html) {
      const content = currentDocument.content || mockDocumentContent;
      // 문단 단위로 분리
      content.split(/\n{2,}/).forEach(para => {
        const trimmed = para.trim();
        if (trimmed) result.push({ type: 'text', content: para, rawText: normalizeText(trimmed) });
      });
      return result;
    }

    const tableRegex = /<table[\s\S]*?<\/table>/gi;
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(html)) !== null) {
      // 표 앞 텍스트 — 문단 단위로 분리
      if (match.index > lastIndex) {
        const div = document.createElement('div');
        div.innerHTML = html.slice(lastIndex, match.index);
        // p 태그 기준으로 문단 분리
        const paragraphs = div.querySelectorAll('p');
        if (paragraphs.length > 0) {
          paragraphs.forEach(p => {
            const text = (p.innerText || p.textContent || '').trim();
            if (text) result.push({ type: 'text', content: text, rawText: normalizeText(text) });
          });
        } else {
          // p 태그 없으면 전체 텍스트를 빈 줄 기준으로 분리
          const fullText = div.innerText || div.textContent || '';
          fullText.split(/\n{2,}/).forEach(para => {
            const trimmed = para.trim();
            if (trimmed) result.push({ type: 'text', content: trimmed, rawText: normalizeText(trimmed) });
          });
        }
      }

      // 표 처리
      const tableDiv = document.createElement('div');
      tableDiv.innerHTML = match[0];
      const tdCount = tableDiv.querySelectorAll('td').length;
      const tableText = normalizeText(tableDiv.innerText || tableDiv.textContent || '');

      if (tdCount <= 1) {
        const tdEl = tableDiv.querySelector('td');
        if (tdEl) {
          const text = (tdEl.innerText || tdEl.textContent || '').trim();
          if (text) result.push({ type: 'text', content: text, rawText: normalizeText(text) });
        }
      } else {
        result.push({ type: 'table', content: match[0], rawText: tableText });
      }

      lastIndex = match.index + match[0].length;
    }

    // 나머지 텍스트
    if (lastIndex < html.length) {
      const div = document.createElement('div');
      div.innerHTML = html.slice(lastIndex);
      const paragraphs = div.querySelectorAll('p');
      if (paragraphs.length > 0) {
        paragraphs.forEach(p => {
          const text = (p.innerText || p.textContent || '').trim();
          if (text) result.push({ type: 'text', content: text, rawText: normalizeText(text) });
        });
      } else {
        const fullText = div.innerText || div.textContent || '';
        fullText.split(/\n{2,}/).forEach(para => {
          const trimmed = para.trim();
          if (trimmed) result.push({ type: 'text', content: trimmed, rawText: normalizeText(trimmed) });
        });
      }
    }

    return result;
  }, [editedHtml, currentDocument.content]);

  // ── 매칭: 정규화된 텍스트로 비교 ──
 const riskFirstAppearance = useMemo(() => {
  const appearances = new Map<number, number>();
  const blockMatchCount = new Map<number, number>(); // 블록당 매칭 수 제한

  riskData.forEach((risk: RiskItem, riskIdx: number) => {
    const clauseRaw = normalizeText(risk.clauseText?.trim() ?? '');
    if (!clauseRaw) return;

    const getMatchScore = (blockRawText: string): number => {
      const t = blockRawText;
      if (t.length < 5) return 0;
      if (t.includes(clauseRaw)) return 100;
      if (clauseRaw.includes(t) && t.length > 15) return 85;
      const firstSentence = normalizeText(clauseRaw.split(/[,.。\n]/)[0]);
      if (firstSentence.length > 8 && t.includes(firstSentence)) return 75;
      const articleMatch = clauseRaw.match(/^(제\d+조|①|②|③|④|⑤|\d+\.)/);
      if (articleMatch && t.includes(articleMatch[0])) {
        const words = clauseRaw.split(' ').filter(w => w.length > 3);
        if (words.length === 0) return 0;
        const matchCount = words.filter(w => t.includes(w)).length;
        const ratio = matchCount / words.length;
        if (ratio >= 0.4) return 60 + ratio * 20;
      }
      const words = clauseRaw.split(' ').filter(w => w.length > 3);
      if (words.length === 0) return 0;
      const matchCount = words.filter(w => t.includes(w)).length;
      const ratio = matchCount / words.length;
      return ratio >= 0.5 ? ratio * 50 : 0;
    };

    let bestScore = 0;
    let bestBlockIndex = -1;

    blocks.forEach((block, blockIndex) => {
      // 한 블록에 최대 2개까지만 매칭 허용
      if ((blockMatchCount.get(blockIndex) ?? 0) >= 2) return;
      const score = getMatchScore(block.rawText);
      // 점수가 낮은 경우 큰 블록(특약사항 등)에 매칭 방지
      if (score < 70 && block.rawText.length > 200) return;
      if (score > bestScore) {
        bestScore = score;
        bestBlockIndex = blockIndex;
      }
    });

    if (bestBlockIndex < 0 || bestScore < 25) {
      const fallbackIndex = Math.floor((riskIdx / riskData.length) * blocks.length);
      appearances.set(riskIdx, Math.min(fallbackIndex, blocks.length - 1));
    } else {
      appearances.set(riskIdx, bestBlockIndex);
      blockMatchCount.set(bestBlockIndex, (blockMatchCount.get(bestBlockIndex) ?? 0) + 1);
    }
  });

  return appearances;
}, [blocks, riskData]);
 const riskPositions = useMemo(() => {
  return riskData
    .map((risk: RiskItem, index: number) => {
      const blockIndex = riskFirstAppearance.get(index);
      if (blockIndex === undefined) return null; // 매칭 실패 제외
      return {
        ...risk,
        position: Math.min((blockIndex / blocks.length) * 100, 97),
        index,
      };
    })
    .filter(Boolean) as any[];
}, [riskData, riskFirstAppearance, blocks.length]);

  const adjustedPositions = useMemo(() => {
    const MIN_GAP = 3;
    const sorted = [...riskPositions].sort((a, b) => a.position - b.position);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].position - sorted[i - 1].position < MIN_GAP) {
        sorted[i] = { ...sorted[i], position: sorted[i - 1].position + MIN_GAP };
      }
    }
    return riskPositions.map(r => sorted.find(s => s.index === r.index) || r);
  }, [riskPositions]);

  const handleDotClick = (riskIndex: number) => {
    const reasonElement = document.getElementById(`reason-box-${riskIndex}`);
    const riskElement = document.getElementById(`risk-${riskIndex}`);
    const target = reasonElement || riskElement;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('highlight-active');
    setTimeout(() => target.classList.remove('highlight-active'), 2000);
  };

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="content-section">
      <div className="dangerous-box">
        <div className='danger-box-text'>
          <div className="info-icon-wrapper">
            <span className="info-icon">
              <MdError 
                onMouseEnter={() => setIsGuideOpen(true)}
                onMouseLeave={() => setIsGuideOpen(false)}
              />
            </span>
            <p>{riskFirstAppearance.size}개의 위험 포인트를 찾았어요</p>
            {isGuideOpen && (
              <div className="risk-guide-content">
                <div className="risk-level-guide">
                  <div className="guide-item high">
                    <span className="guide-dot"></span>
                    <div className="guide-text">
                      <strong>높음 (High)</strong>
                      <p>계약자에게 심각한 불이익을 줄 수 있는 조항입니다. 반드시 수정하거나 전문가 상담이 필요합니다.</p>
                    </div>
                  </div>
                  <div className="guide-item medium">
                    <span className="guide-dot"></span>
                    <div className="guide-text">
                      <strong>중간 (Medium)</strong>
                      <p>주의가 필요한 조항입니다. 상황에 따라 불리할 수 있으니 신중히 검토하세요.</p>
                    </div>
                  </div>
                  <div className="guide-item low">
                    <span className="guide-dot"></span>
                    <div className="guide-text">
                      <strong>낮음 (Low)</strong>
                      <p>경미한 주의사항입니다. 참고용으로 확인하시면 됩니다.</p>
                    </div>
                  </div>
                </div>
                <div className="guide-tips">
                  <h4>위험도 보는 팁</h4>
                  <ul>
                    <li>위 막대의 점을 클릭하면 해당 위치로 이동합니다</li>
                    <li>각 조항 아래에 위험 이유와 대응 방법이 표시됩니다</li>
                    <li>의심스러운 조항은 전문가와 상담하는 것을 권장합니다</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="risk-position-bar">
          {adjustedPositions.map((risk, index) => (
            <div
              key={index}
              className={`risk-dot severity-${normalizeRiskLevel(risk.riskLevel)}`}
              style={{ left: `${risk.position}%` }}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>

      <div
        className="content-analysis-box has-header"
        style={{
          fontSize: `${zoomLevel / 100}em`,
          transformOrigin: 'top',
        }}
      >
        <DocumentMeta 
          filename={currentDocument.filename}
          uploadDate={currentDocument.uploadDate}
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />

        <div className="document-with-danger">
          <div className="danger-header">
            <h2>위험 탐지</h2>
            <p className="danger-description">
              AI 분석 결과 본 계약서에서 잠재적 법적 위험이 확인되었습니다. <br />
              표시된 조항을 검토하시고 권고된 대응 가이드를 참고하여 수정 또는 재검토하세요.
            </p>
          </div>

          {(() => {
            const matchedRiskIndices = new Set<number>();

            return blocks.map((block, blockIndex) => {
              if (block.type === 'table') {
                const matchedRiskIndicesForBlock: number[] = [];
                riskFirstAppearance.forEach((appearBlockIndex, riskIdx) => {
                  if (appearBlockIndex === blockIndex && !matchedRiskIndices.has(riskIdx)) {
                    matchedRiskIndicesForBlock.push(riskIdx);
                  }
                });

                if (matchedRiskIndicesForBlock.length > 0) {
                  const highestLevel = matchedRiskIndicesForBlock.reduce((highest, riskIdx) => {
                    const level = normalizeRiskLevel(riskData[riskIdx].riskLevel);
                    if (level === 'high') return 'high';
                    if (level === 'medium' && highest !== 'high') return 'medium';
                    return highest;
                  }, 'low' as 'high' | 'medium' | 'low');

                  matchedRiskIndicesForBlock.forEach(idx => matchedRiskIndices.add(idx));

                  return (
                    <div key={blockIndex} id={`risk-${matchedRiskIndicesForBlock[0]}`} className={`danger-item severity-${highestLevel}`}>
                      <div className={`danger-table-block table-border-${highestLevel}`} dangerouslySetInnerHTML={{ __html: block.content }} />
                      {matchedRiskIndicesForBlock.map(riskIdx => {
                        const risk = riskData[riskIdx];
                        const level = normalizeRiskLevel(risk.riskLevel);
                        return (
                          <div key={riskIdx}>
                            <div className={`clause-table-box severity-${level}`}>
                              <p className="clause-text">{risk.clauseText}</p>
                            </div>
                            <div id={`reason-box-${riskIdx}`} className={`reason-box severity-${level}`}>
                              <p className="reason">⚠️ {risk.reason || risk.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div key={blockIndex} className="danger-table-block" dangerouslySetInnerHTML={{ __html: block.content }} />
                );
              }

              // 텍스트 블록
              const line = block.content;
              const trimmedLine = line.trim();

              if (trimmedLine.length < 5) {
                return <p key={blockIndex} className="document-line">{line || '\u00A0'}</p>;
              }

              const matchedRiskIndicesForBlock: number[] = [];
              riskFirstAppearance.forEach((appearBlockIndex, riskIdx) => {
                if (appearBlockIndex === blockIndex && !matchedRiskIndices.has(riskIdx)) {
                  matchedRiskIndicesForBlock.push(riskIdx);
                }
              });

              if (matchedRiskIndicesForBlock.length === 0) {
                return <p key={blockIndex} className="document-line">{line || '\u00A0'}</p>;
              }

              const highestLevel = matchedRiskIndicesForBlock.reduce((highest, riskIdx) => {
                const level = normalizeRiskLevel(riskData[riskIdx].riskLevel);
                if (level === 'high') return 'high';
                if (level === 'medium' && highest !== 'high') return 'medium';
                return highest;
              }, 'low' as 'high' | 'medium' | 'low');

              matchedRiskIndicesForBlock.forEach(idx => matchedRiskIndices.add(idx));

              return (
                <div key={blockIndex} id={`risk-${matchedRiskIndicesForBlock[0]}`} className={`danger-item severity-${highestLevel}`}>
                  <p className={`document-line highlight-${highestLevel}`}>
                    {line}
                  </p>
                  {matchedRiskIndicesForBlock.map(riskIdx => {
                    const risk = riskData[riskIdx];
                    const level = normalizeRiskLevel(risk.riskLevel);
                    return (
                      <div id={`reason-box-${riskIdx}`} key={riskIdx} className={`reason-box severity-${level}`}>
                        <p className="reason"><MdWarning className="warning-icon" /> {risk.reason || risk.description}</p>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div> 
      </div>
    </div>
  );
}

export default DangerView;