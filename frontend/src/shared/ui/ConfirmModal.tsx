import Modal from './Modal'
import Button from './Button'
import ModalFooter from './ModalFooter'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    // Don't close immediately if isLoading is true (handled by parent usually)
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={!isLoading ? onClose : () => {}} title={title}>
      <div className="text-gray-600 mb-6 leading-relaxed">{message}</div>
      <ModalFooter className="rounded-b-xl">
        <Button onClick={onClose} variant="secondary" disabled={isLoading}>
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} disabled={isLoading} variant={variant}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

