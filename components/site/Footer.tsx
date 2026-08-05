import Link from "next/link";
import { Stamp } from "@/components/ui/Stamp";

export function Footer() {
  return (
    <footer id="contacts" className="mt-24 bg-charcoal text-flatbread-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Stamp tone="charcoal" className="h-10 w-10 text-sm font-display font-bold">
              AP
            </Stamp>
            <span className="font-display text-lg font-semibold">Adana Pizza</span>
          </div>
          <p className="mt-4 max-w-xs font-display text-xl italic text-saffron">
            Всё лучшее для вас
          </p>
          <p className="mt-4 text-sm text-flatbread-2/60">
            Пицца на тонком тесте с турецким характером — печём с 2019 года на Боровском шоссе.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-flatbread-2/50">
            Контакты
          </h3>
          <ul className="mt-4 space-y-2 text-[15px]">
            <li>
              <a href="tel:+79932590143" className="hover:text-saffron">
                +7 (993) 259-01-43
              </a>
            </li>
            <li className="text-flatbread-2/80">
              Москва, Боровское шоссе, 27к1
            </li>
            <li className="text-flatbread-2/80">Ежедневно, до 23:00</li>
            <li>
              <a
                href="https://vk.ru/club239822914"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-saffron"
              >
                Мы во ВКонтакте
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-flatbread-2/50">
            Меню
          </h3>
          <ul className="mt-4 space-y-2 text-[15px]">
            <li>
              <Link href="/menu" className="hover:text-saffron">
                Вся пицца
              </Link>
            </li>
            <li>
              <Link href="/menu#sets" className="hover:text-saffron">
                Наборы
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-saffron">
                Мои заказы
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-flatbread-2/10 px-5 py-5 text-center text-xs text-flatbread-2/40">
        © {new Date().getFullYear()} Adana Pizza. Все права защищены.
      </div>
    </footer>
  );
}
