import { useState, useCallback } from 'react'

interface ImageOptimizationOptions {
  quality?: number
  sizes?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function useImageOptimization() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const markImageLoaded = useCallback((src: string) => {
    setLoadedImages(prev => new Set([...prev, src]))
  }, [])

  const markImageFailed = useCallback((src: string) => {
    setFailedImages(prev => new Set([...prev, src]))
  }, [])

  const isImageLoaded = useCallback(
    (src: string) => {
      return loadedImages.has(src)
    },
    [loadedImages]
  )

  const hasImageFailed = useCallback(
    (src: string) => {
      return failedImages.has(src)
    },
    [failedImages]
  )

  const getOptimizedImageProps = useCallback(
    (src: string, alt: string, options: ImageOptimizationOptions = {}) => {
      const {
        quality = 85,
        sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
        priority = false,
        placeholder = 'empty',
        blurDataURL,
      } = options

      return {
        src,
        alt,
        quality,
        sizes,
        priority,
        placeholder,
        blurDataURL,
        onLoad: () => markImageLoaded(src),
        onError: () => markImageFailed(src),
        loading: priority ? undefined : ('lazy' as const),
      }
    },
    [markImageLoaded, markImageFailed]
  )

  return {
    isImageLoaded,
    hasImageFailed,
    getOptimizedImageProps,
    markImageLoaded,
    markImageFailed,
  }
}
