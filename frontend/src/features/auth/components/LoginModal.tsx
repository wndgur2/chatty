import { useActionState, useState } from 'react'
import { useLogin } from '../hooks/useLogin'
import Modal from '../../../shared/ui/Modal'
import ModalFooter from '../../../shared/ui/ModalFooter'
import Input from '../../../shared/ui/Input'
import Button from '../../../shared/ui/Button'

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const loginMutation = useLogin()
  const [username, setUsername] = useState('')
  const [loginState, submitLogin, isSubmitting] = useActionState(
    async (_: { error: string }, formData: FormData) => {
      const trimmed = String(formData.get('username') ?? '').trim()
      if (!trimmed) {
        return { error: 'Username is required.' }
      }

      try {
        await loginMutation.mutateAsync({ username: trimmed })
        setUsername('')
        onSuccess?.()
        onClose()
        return { error: '' }
      } catch {
        return { error: 'Login failed. Please try again.' }
      }
    },
    { error: '' },
  )
  const isBusy = isSubmitting || loginMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in">
      <p className="text-sm text-gray-600">
        Save your chatrooms across devices. Your current guest session will be merged into this
        account.
      </p>
      <form action={submitLogin} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="login-modal-username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <Input
            id="login-modal-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="my-username"
            autoComplete="username"
            error={loginState.error}
            disabled={isBusy}
          />
        </div>
        <ModalFooter className="w-full">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!username.trim() || isBusy}>
            {isBusy ? 'Signing in…' : 'Sign in'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
