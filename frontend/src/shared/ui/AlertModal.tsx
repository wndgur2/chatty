import Modal from './Modal'
import Button from './Button'
import ModalFooter from './ModalFooter'

export interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  confirmText?: string
}

export default function AlertModal({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  confirmText = 'OK',
}: AlertModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-gray-600 mb-6 leading-relaxed">{message}</div>
      <ModalFooter className="rounded-b-xl">
        <Button onClick={onClose} variant="primary">
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

