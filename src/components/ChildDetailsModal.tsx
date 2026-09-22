import React from 'react';
import { MemberProfileModal } from './MemberProfileModal';
import { FamilyMember } from '../types';

export interface ChildDetailsModalProps {
  member: FamilyMember;
  isOpen: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
}

/**
 * Backward compatibility alias for MemberProfileModal.
 */
export const ChildDetailsModal: React.FC<ChildDetailsModalProps> = (props) => {
  return <MemberProfileModal {...props} />;
};

export { MemberProfileModal };
