import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { getHomeCategories, getSignatureDish, getActiveHeroSlides } from "@/lib/cache/menu";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Stamp } from "@/components/ui/Stamp";
import { PizzaMark } from "@/components/site/PizzaMark";
import { HeroSlider } from "@/components/site/HeroSlider";

/** Drop a file named hero-pizza.(webp|jpg|jpeg|png) into /public to replace the
 *  placeholder illustration below with a real photo — no code changes needed. */
const HERO_IMAGE_CANDIDATES = ["hero-pizza.webp", "hero-pizza.jpg", "hero-pizza.jpeg", "hero-pizza.png"];

function findHeroImage(): string | null {
  for (const filename of HERO_IMAGE_CANDIDATES) {
    if (existsSync(path.join(process.cwd(), "public", filename))) {
      return `/${filename}`;
    }
  }
  return null;
}

export default async function HomePage() {
  const heroImageSrc = findHeroImage();
  const [categories, signatureDish, heroSlides] = await Promise.all([
    getHomeCategories(),
    getSignatureDish(),
    getActiveHeroSlides(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-saffron/15 to-transparent" />

        {heroSlides.length > 0 ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-14 md:grid-cols-2 md:pt-20">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-ember">
                Пиццерия на Боровском шоссе
              </span>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] text-char md:text-6xl">
                Всё лучшее
                <br />
                <span className="italic text-ember">для вас</span>
              </h1>
              <p className="mt-5 max-w-md text-lg text-char/70">
                Тонкое тесто, живой огонь и турецкий характер — Adana Pizza печёт
                пиццу так, как её не делают в соседнем дворе.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/menu">
                  <Button size="lg">Смотреть меню</Button>
                </Link>
              </div>
            </div>

            {heroImageSrc ? (
              <Image
                src={heroImageSrc}
                alt="Пицца Adana"
                width={640}
                height={640}
                priority
                className="mx-auto w-full max-w-sm object-contain drop-shadow-2xl md:max-w-md"
              />
            ) : (
              <PizzaMark className="mx-auto w-full max-w-sm md:max-w-md" />
            )}
          </div>
        )}

        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 pb-16 md:pb-24">
          <a href="tel:+79932590143">
            <Button size="lg" variant="secondary">
              +7 (993) 259-01-43
            </Button>
          </a>
          <Badge tone="saffron">★ 4.8 · 71 отзыв</Badge>
          <Badge tone="neutral">Открыто до 23:00</Badge>
          <Badge tone="neutral">Доставка и самовывоз</Badge>
        </div>
      </section>

      {/* Categories teaser */}
      <section className="mx-auto max-w-6xl px-5 py-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => {
            const photoUrl = c.dishes[0]?.media[0]?.url;
            return (
              <Link
                key={c.id}
                href={`/menu#${c.slug}`}
                className="group rounded-2xl bg-flatbread-2 p-5 transition-transform hover:-translate-y-0.5"
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <Stamp tone="flatbread" className="h-12 w-12 text-lg font-display font-semibold">
                    {c.name.slice(0, 1)}
                  </Stamp>
                )}
                <p className="mt-3 font-display text-lg font-semibold text-char">{c.name}</p>
                <p className="text-sm text-char/50">{c._count.dishes} позиций</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Signature dish */}
      {signatureDish && signatureDish.variants[0] && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid items-center gap-8 rounded-3xl bg-char px-8 py-10 text-flatbread md:grid-cols-[auto_1fr] md:px-14">
            <Stamp tone="charcoal" className="mx-auto h-32 w-32 text-3xl font-display font-bold md:mx-0">
              A
            </Stamp>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-saffron">
                Фирменное блюдо
              </span>
              <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
                Пицца «{signatureDish.name}»
              </h2>
              <p className="mt-3 max-w-xl text-flatbread/70">{signatureDish.description}</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="font-sans text-2xl font-bold text-saffron">
                  {formatMinor(signatureDish.variants[0].priceMinor)}
                </span>
                <Link href={`/dish/${signatureDish.id}`}>
                  <Button variant="primary">Заказать</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-ember">О нас</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-char">
              Пицца, обожжённая до правильного хруста
            </h2>
          </div>
          <div className="space-y-4 text-char/70">
            <p>
              Adana Pizza — семейная пиццерия на Боровском шоссе. Мы раскатываем
              тесто вручную каждое утро и выпекаем пиццу на камне — так корочка
              получается тонкой и с настоящими подпалинами.
            </p>
            <p>
              Название в честь турецкого города Адана и фирменной пиццы с острой
              аданской колбасой — нашего главного гастрономического эксперимента,
              который прижился в меню.
            </p>
            <p>Работаем ежедневно до 23:00. Доставляем по району и готовим навынос.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
