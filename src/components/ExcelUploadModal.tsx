import React from 'react';
import { CsvImportModal } from './CsvImportModal';

interface ExcelUploadModalProps {
  onClose: () => void;
  defaultCampaignId?: string;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ onClose, defaultCampaignId }) => {
  return <CsvImportModal onClose={onClose} defaultCampaignId={defaultCampaignId} />;
};

export default ExcelUploadModal;
