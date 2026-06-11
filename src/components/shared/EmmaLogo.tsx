interface EmmaLogoProps {
  className?: string;
}

export default function EmmaLogo({ className = "h-8 w-auto" }: EmmaLogoProps) {
  return (
    <img
      src="/assets/LOGO.png"
      alt="EmmaSystem"
      /* ✅ Sin max-h aquí: el tamaño lo controla exclusivamente className */
      className={className}
    />
  );
}