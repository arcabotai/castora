import Image from "next/image";

interface DegenLogoProps {
  width?: number;
  height?: number;
}

export default function DegenLogo(props: DegenLogoProps): JSX.Element {

  return (
    <Image
      width="320"
      height="320"
      className={`w-${props.width} h-${props.height} rounded-full object-cover`}
      src="/degen-logo.jpeg"
      alt="Degen logo"
    />
  );
}