import { Search } from 'lucide-react';

interface CentralQuestionProps {
  question: string;
}

export function CentralQuestion({ question }: CentralQuestionProps) {
  return (
    <aside className="border-2 border-primary bg-primary-light px-6 py-10 sm:px-10 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center border-2 border-primary text-primary">
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <span className="eyebrow text-primary-dark">Question centrale</span>
      </div>
      <p className="mt-6 font-serif text-[22px] font-normal leading-[1.4] text-ink sm:text-[28px] lg:text-[32px]">
        {question}
      </p>
    </aside>
  );
}
