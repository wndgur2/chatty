import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const useProfileImageInput = () => {
  const [profileImage, setProfileImage] = useState<File | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrl = useMemo(
    () => (profileImage ? URL.createObjectURL(profileImage) : null),
    [profileImage],
  )

  useEffect(() => {
    if (!previewUrl) return
    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const clearProfileImage = useCallback(() => {
    setProfileImage(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return {
    profileImage,
    setProfileImage,
    previewUrl,
    clearProfileImage,
    fileInputRef,
  }
}
