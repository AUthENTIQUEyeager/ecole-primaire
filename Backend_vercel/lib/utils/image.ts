'use client'

/**
 * Redimensionne et compresse une image côté navigateur avant de l'encoder
 * en base64, pour éviter d'envoyer des payloads trop lourds (et donc plus
 * fiables à sauvegarder, plus rapides à charger dans les PDF).
 */
export function redimensionnerImage(
  file: File,
  maxDimension = 500,
  qualite = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension)
            width = maxDimension
          } else {
            width = Math.round((width / height) * maxDimension)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Contexte canvas indisponible'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', qualite))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
