import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Box, Typography, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import { IoIosExit } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { categoryInfo } from '../../../mock/mockDocuments';
import { mypageAPI } from '../../../api/mypage';
import { DraftDocument } from '../../../types';
import { useToast, ToastType } from '../../../hooks/useToast';
import Toast from '../../common/Toast';

interface DraftTableProps {
  documents: DraftDocument[];
  isLoading: boolean;
  onRefresh: () => void | Promise<void>;
}

export default function DraftTableMUI({ documents, isLoading, onRefresh }: DraftTableProps) {
  const { toast, showToast, hideToast } = useToast();

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '12px',
          boxShadow: 'none',
          border: '1px solid #E5E7EB',
          '& .MuiTableCell-root': {
            height: { xs: '38px', xl: '46px' },
            maxHeight: { xs: '38px', xl: '46px' },
            minHeight: { xs: '38px', xl: '46px' },
            padding: { xs: '0px 16px', xl: '0px 20px' },
            boxSizing: 'border-box',
            fontSize: { xs: '13px', xl: '15px' },
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
              <TableCell width="15%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: { xs: '13px', xl: '15px' }, borderBottom: '1px solid #E5E7EB' }}>
                계약 유형
              </TableCell>
              <TableCell width="40%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: { xs: '13px', xl: '15px' }, borderBottom: '1px solid #E5E7EB' }}>
                계약서 제목
              </TableCell>
              <TableCell width="15%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: { xs: '13px', xl: '15px' }, borderBottom: '1px solid #E5E7EB' }}>
                업로드일
              </TableCell>
              <TableCell width="25%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: { xs: '13px', xl: '15px' }, borderBottom: '1px solid #E5E7EB' }}>
                분석 상태
              </TableCell>
              <TableCell width="5%" sx={{ borderBottom: '1px solid #E5E7EB' }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ padding: 0, border: 'none' }}>
                  <Box sx={{ padding: '60px 40px', textAlign: 'center', backgroundColor: '#fff' }}>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                      미분석 계약서가 없습니다
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((draft) => (
                <DraftRow key={draft.id} draft={draft} onRefresh={onRefresh} onToast={showToast} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Toast {...toast} onClose={hideToast} />
    </>
  );
}

function DraftRow({
  draft,
  onRefresh,
  onToast,
}: {
  draft: DraftDocument;
  onRefresh: () => void;
  onToast: (message: string, type: ToastType) => void;
}) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleView = () => {
    handleClose();
    navigate('/analysis', {
      state: { documentId: draft.id, filename: draft.title, autoAnalyze: true },
    });
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    try {
      await mypageAPI.deleteDocument(draft.id);
      onRefresh();
      onToast('계약서가 삭제되었습니다.', 'success');
    } catch (e) {
      onToast('삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <>
      <TableRow sx={{ '&:hover': { backgroundColor: '#FAFBFC' }, borderBottom: '1px solid #F3F4F6' }}>
        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
          <Chip
            label={categoryInfo[draft.category]?.label ?? '부동산'}
            sx={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 600, fontSize: '11px', width: '55px', height: '24px', borderRadius: '6px' }}
          />
        </TableCell>

        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', maxWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: '14px', xl: '15px' }, fontWeight: 500, color: '#111827', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {draft.title}
          </Typography>
        </TableCell>

        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
          <Typography sx={{ fontSize: { xs: '14px', xl: '15px' }, color: '#6B7280' }}>
            {formatDateString(draft.lastEditedAt)}
          </Typography>
        </TableCell>

        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeFilledRoundedIcon sx={{ fontSize: { xs: '18px', xl: '20px' }, color: '#F59E0B' }} />
            <Typography sx={{ fontSize: { xs: '14px', xl: '15px' }, fontWeight: 500, color: '#F59E0B' }}>
              {draft.statusText || '미분석'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
          <IconButton size="small" onClick={handleClick} sx={{ color: '#9CA3AF', padding: '6px', '&:hover': { backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: '5px' } }}>
            <MoreVertIcon sx={{ fontSize: '18px' }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl} open={open} onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', minWidth: '180px', mt: 0.5 } }}
          >
            <MenuItem onClick={handleView} sx={{ padding: '12px 16px', '&:hover': { backgroundColor: '#F9FAFB' } }}>
              <ListItemIcon><RemoveRedEyeIcon sx={{ fontSize: '20px', color: '#374151' }} /></ListItemIcon>
              <ListItemText primary="보기" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500, color: '#374151' }} />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={() => { handleClose(); setShowDeleteModal(true); }} sx={{ padding: '12px 16px', '&:hover': { backgroundColor: '#FEF2F2' } }}>
              <ListItemIcon><DeleteIcon sx={{ fontSize: '20px', color: '#DC2626' }} /></ListItemIcon>
              <ListItemText primary="삭제" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500, color: '#DC2626' }} />
            </MenuItem>
          </Menu>
        </TableCell>
      </TableRow>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <tr>
          <td colSpan={5} style={{ padding: 0, border: 'none' }}>
            <div className="exit-modal-overlay">
              <div className="exit-modal">
                <div className="modal-icon">
                  <IoIosExit size={32} color="#E53E3E" />
                </div>
                <p className="exit-modal-text">계약서를 삭제하시겠습니까?</p>
                <p className="exit-modal-sub">'{draft.title}' 계약서가 영구적으로 삭제됩니다.</p>
                <div className="exit-modal-buttons">
                  <button className="exit-cancel-btn" onClick={() => setShowDeleteModal(false)}>취소</button>
                  <button className="exit-confirm-btn" onClick={handleDeleteConfirm}>삭제하기</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatDateString(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}