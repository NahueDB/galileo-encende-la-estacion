import Link from 'next/link';
import Image from 'next/image';
export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Galileo, inicio">
      <Image
        src="/brand/galileo-oficial.png"
        alt=""
        width={48}
        height={58}
        priority
        className="school-logo"
      />
      <span>
        GALILEO<small>E.E.S.T. N.º 5 · GRAL. SAN MARTÍN</small>
      </span>
    </Link>
  );
}
