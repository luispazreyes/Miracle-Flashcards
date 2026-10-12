// Vista previa en vivo de una flashcard de ejemplo (F-08): refleja tema, paleta de tarjeta y lado de la imagen.
import { Icon } from '../../components/Icon'
import type { ImageSide } from '../../domain'
import { settings as t } from '../../lib/messages.es'

function Face({ title, text, image }: { title: string; text: string; image: boolean }) {
  return (
    <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-borde bg-tarjeta p-4 text-center text-sobre-tarjeta shadow-2">
      <p className="text-sm opacity-80">{title}</p>
      {image && (
        <p className="flex items-center gap-1 rounded-md border border-current px-3 py-2 text-sm">
          <Icon name="folder" className="size-4" />
          {t.previewImage}
        </p>
      )}
      <p className="text-lg font-semibold">{text}</p>
    </div>
  )
}

export function CardPreview({ imageSide }: { imageSide: ImageSide }) {
  return (
    <section aria-labelledby="vista-previa" className="flex flex-col gap-2">
      <h2 id="vista-previa" className="font-semibold">
        {t.preview}
      </h2>
      <div className="flex flex-wrap gap-3">
        <Face
          title={t.previewFront}
          text={t.previewWord}
          image={imageSide === 'front' || imageSide === 'both'}
        />
        <Face
          title={t.previewBack}
          text={t.previewTranslation}
          image={imageSide === 'back' || imageSide === 'both'}
        />
      </div>
    </section>
  )
}
