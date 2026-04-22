import type { ChangeEvent, RefObject } from 'react'
import { UploadCloud, Trash2 } from 'lucide-react'
import Button from '../../../shared/ui/Button'
import Avatar from '../../../shared/ui/Avatar'
import Input from '../../../shared/ui/Input'

export interface ChatroomConfigurationProps {
  nameFieldId: string
  name: string
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void
  promptFieldId: string
  basePrompt: string
  onBasePromptChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  promptRequired?: boolean
  imageFieldId: string
  previewUrl: string | null
  fallbackChar: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onProfileImageChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClearProfileImage: () => void
}

export default function ChatroomConfiguration({
  nameFieldId,
  name,
  onNameChange,
  promptFieldId,
  basePrompt,
  onBasePromptChange,
  promptRequired = true,
  imageFieldId,
  previewUrl,
  fallbackChar,
  fileInputRef,
  onProfileImageChange,
  onClearProfileImage,
}: ChatroomConfigurationProps) {
  return (
    <>
      <div>
        <label htmlFor={nameFieldId} className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <Input
          id={nameFieldId}
          name="name"
          placeholder="e.g., Frontend Team"
          value={name}
          onChange={onNameChange}
        />
      </div>

      <div>
        <label htmlFor={promptFieldId} className="block text-sm font-medium text-gray-700 mb-1">
          Base Prompt
        </label>
        <textarea
          id={promptFieldId}
          name="basePrompt"
          placeholder="You are a helpful assistant..."
          value={basePrompt}
          onChange={onBasePromptChange}
          className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-y"
          required={promptRequired}
        />
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
        <label htmlFor={imageFieldId} className="block text-sm font-medium text-gray-700 mb-4">
          Profile Image
        </label>
        <div className="flex items-center gap-5">
          <div className="shrink-0 relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-white  bg-gray-50"
              />
            ) : (
              <Avatar
                fallback={fallbackChar}
                className="w-16 h-16 text-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 border-2 border-white "
              />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input
              id={imageFieldId}
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={onProfileImageChange}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={previewUrl ? 'secondary' : 'primary'}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 shadow-sm"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                {previewUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClearProfileImage}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-gray-200"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">Square image is recommended.</p>
          </div>
        </div>
      </div>
    </>
  )
}
