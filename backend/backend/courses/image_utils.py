from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

# პროექტის სტანდარტი ყველა ატვირთული სურათისთვის (ავატარი, კურსის სურათი):
# კვადრატული ფორმა + მაქსიმუმ 512x512 პიქსელი. ეს არ ზღუდავს რას ტვირთავს
# მასწავლებელი/მომხმარებელი — ნებისმიერი ზომის/პროპორციის სურათი შემოდის,
# უბრალოდ ავტომატურად შენახვისას (server-side) იჭრება ცენტრში კვადრატულად
# და მცირდება საჭიროებისამებრ, ისე რომ საიტზე ყველგან ერთნაირი პროპორციით
# გამოჩნდეს (card-icon, modal-header, ავატარი და ა.შ.), მიუხედავად წყარო
# ფაილის ორიგინალი ზომისა.
MAX_DIMENSION = 512


def square_thumbnail(image_field_file, max_dimension=MAX_DIMENSION):
    """
    ცენტრში ჭრის სურათს კვადრატულად (მოკლე გვერდის მიხედვით) და, თუ საჭიროა,
    ამცირებს ზომას max_dimension x max_dimension-მდე (მხოლოდ დაპატარავება,
    არასდროს გადიდება — მცირე სურათი მცირედვე რჩება, უბრალოდ კვადრატდება).

    აბრუნებს Django-ს ContentFile-ს, რომელიც პირდაპირ შეიძლება მიენიჭოს
    ImageField-ს (model.save()-მდე), მიუხედავად იმისა ლოკალურ დისკზე
    ინახება თუ Cloudinary-ზე.
    """
    image_field_file.seek(0)
    img = Image.open(image_field_file)

    # ტელეფონით გადაღებული ფოტოების ბრუნვის მეტამონაცემი სწორად გავითვალისწინოთ
    img = ImageOps.exif_transpose(img)

    has_transparency = img.mode in ('RGBA', 'LA') or (
        img.mode == 'P' and 'transparency' in img.info
    )
    img = img.convert('RGBA' if has_transparency else 'RGB')

    width, height = img.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    img = img.crop((left, top, left + side, top + side))

    if side > max_dimension:
        img = img.resize((max_dimension, max_dimension), Image.LANCZOS)

    buffer = BytesIO()
    if has_transparency:
        img.save(buffer, format='PNG', optimize=True)
        ext = 'png'
    else:
        img.save(buffer, format='JPEG', quality=90, optimize=True)
        ext = 'jpg'

    original_name = getattr(image_field_file, 'name', f'image.{ext}') or f'image.{ext}'
    base_name = original_name.rsplit('/', 1)[-1].rsplit('.', 1)[0]

    return ContentFile(buffer.getvalue(), name=f'{base_name}.{ext}')
