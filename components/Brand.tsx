import Link from 'next/link';
export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Galileo, inicio">
      <span className="brand-symbol">
        G<span>·</span>
      </span>
      <span>
        GALILEO<small>LABORATORIO INTERACTIVO</small>
      </span>
    </Link>
  );
}
