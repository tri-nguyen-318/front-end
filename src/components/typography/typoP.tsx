type Props = {
  children: React.ReactNode;
};

export function TypoP({ children }: Props) {
  return <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>;
}
