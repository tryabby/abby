import { TRPCClientError } from '@trpc/client'
import { TRPC_ERROR_CODES_BY_KEY } from '@trpc/server/rpc'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { trpc } from 'utils/trpc'
import { Modal } from './Modal'
import { Input } from './ui/input'

type Props = {
  onClose: () => void
  isOpen: boolean
  projectId: string
}

export const CreateAPIKeyModal = ({ onClose, isOpen, projectId }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const ctx = trpc.useContext()
  const [name, setName] = useState<string>('')
  const trimmedName = name.trim()

  const { mutate: createApiKey } = trpc.apikey.createApiKey.useMutation({
    onSuccess() {
      toast.success('API Key created')
    },
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Create new API Key'
      confirmText='Create'
      onConfirm={async () => {
        if (!trimmedName) {
          toast.error('Name is required')
          return
        }
        try {
          setName('')
          toast.success('API Key created')
          onClose()
        } catch (e) {
          toast.error(
            e instanceof TRPCClientError && e.shape.code === TRPC_ERROR_CODES_BY_KEY.FORBIDDEN
              ? e.message
              : 'Error creating API Key'
          )
        }
      }}
    >
      <label className='mb-1 block text-pink-50'>Name</label>
      <Input
        ref={inputRef}
        type='text'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Name of the Application'
      />
    </Modal>
  )
}
