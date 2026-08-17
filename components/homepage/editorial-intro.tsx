interface EditorialIntroProps {
  label: string;
  title: string;
  question: string;
}

export function EditorialIntro({ label, title, question }: EditorialIntroProps) {
  return (
    <section className="border-t border-border">
      <div className="container-editorial py-16 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{label}</p>
          <h2 className="section-title mt-4 text-[36px] sm:text-[48px] lg:text-[64px]">
            {title}
          </h2>
          <div className="mx-auto mt-8 h-px w-16 bg-primary" aria-hidden />
          <p className="mt-8 font-serif text-[20px] leading-[1.6] text-text sm:text-[22px] lg:text-[24px]">
            {question}
          </p>
        </div>
      </div>
    </section>
  );
}
