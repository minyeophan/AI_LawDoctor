import { useState, useEffect, useCallback } from 'react';
import DraftTableMUI from './DraftTableMUI';
import StorageTableMUI from './StorageTableMUI';
import '../mydocuments/MyDocument.css';
import { IoSearch } from "react-icons/io5";
import { mypageAPI } from '../../../api/mypage';
import { DraftDocument, StorageDocument } from '../../../types';
import { mockStorageDocuments, mockDrafts } from '../../../mock/mockDocuments';

export default function Documents() {
  const [activeTab, setActiveTab] = useState<'draft' | 'storage'>('draft');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [allDrafts, setAllDrafts] = useState<DraftDocument[]>([]);
  const [allStorage, setAllStorage] = useState<StorageDocument[]>([]);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isStorageLoading, setIsStorageLoading] = useState(false);

  // fetchDrafts, fetchStorage를 useCallback으로 감싸기
const fetchDrafts = useCallback(async () => {
  setIsDraftLoading(true);
  try {
    const sort = sortOrder === 'recent' ? 'recent' : sortOrder === 'oldest' ? 'old' : 'name';
    const data = await mypageAPI.getDrafts(sort, '');
    setAllDrafts(data.list.map((item: any) => ({
      id: item.documentId ?? item._id ?? item.id,
      title: item.title,
      category: item.contractType || 'real_estate',
      progress: item.progress || 0,
      statusText: item.statusText || '미분석',
      lastEditedAt: item.uploadDate ?? item.updatedAt ?? '',
    })));
  } catch (err) {
    console.error('미분석 로딩 실패:', err);
    setAllDrafts(mockDrafts);
  } finally {
    setIsDraftLoading(false);
  }
}, [sortOrder]);

const fetchStorage = useCallback(async () => {
  setIsStorageLoading(true);
  try {
    const sort = sortOrder === 'recent' ? 'recent' : sortOrder === 'oldest' ? 'old' : 'name';
    const data = await mypageAPI.getStorage(sort, '');
    setAllStorage(data.list.map((item: any) => ({
      id: item.documentId ?? item._id ?? item.id,
      title: item.title,
      category: item.contractType || 'real_estate',
      uploadedAt: item.uploadDate ?? item.UploadDate ?? item.createdAt ?? '',
      analysisStatus: item.analysisStatus === '분석 완료' ? 'completed' : 'pending',
      fileUrl: item.fileUrl ?? '',
    })));
  } catch (err) {
    console.error('보관함 로딩 실패:', err);
    setAllStorage(mockStorageDocuments);
  } finally {
    setIsStorageLoading(false);
  }
}, [sortOrder]);

useEffect(() => { fetchDrafts(); }, [fetchDrafts]);
useEffect(() => { fetchStorage(); }, [fetchStorage]);

  // 검색 + 카테고리 필터 모두 프론트에서 처리
  const filteredDrafts = allDrafts
    .filter(d => categoryFilter === 'all' || d.category === categoryFilter)
    .filter(d => !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredStorage = allStorage
    .filter(d => categoryFilter === 'all' || d.category === categoryFilter)
    .filter(d => !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="documents-page">
      <header className="documents-header">
        <h1>내 계약서</h1>
      </header>

      <div className="sliding-tabs">
        <div className="tabs-wrapper">
          <button
            className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            미분석
          </button>
          <button
            className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            보관함
          </button>
          <div
            className="tab-slider"
            style={{ transform: activeTab === 'draft' ? 'translateX(0)' : 'translateX(100%)' }}
          />
        </div>
      </div>

      <div className="controls-area">
        <div className="search-box">
          <input
            type="text"
            placeholder="계약서를 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">
            <span><IoSearch /></span>
          </button>
        </div>
        <div className="filters">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">계약유형</option>
            <option value="부동산">부동산</option>
          </select>
          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="recent">최근순</option>
            <option value="oldest">오래된순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'draft'
? <DraftTableMUI documents={filteredDrafts} isLoading={isDraftLoading} onRefresh={fetchDrafts} />
: <StorageTableMUI documents={filteredStorage} isLoading={isStorageLoading} onRefresh={fetchStorage} />
        }
      </div>
    </div>
  );
}