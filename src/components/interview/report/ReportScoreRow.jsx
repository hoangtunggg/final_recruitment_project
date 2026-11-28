import useInterviewNumber from "../../../hooks/useInterviewNumber";

/** label + 0-10 bar + number. */
const ReportScoreRow = ({ label, score }) => {
  const num = useInterviewNumber();
  const width = `${Math.max(0, Math.min(10, score ?? 0)) * 10}%`;
  return (
    <div className="my-2 grid grid-cols-[1fr_1fr_40px] items-center gap-3.5 font-normal sm:grid-cols-[220px_1fr_44px]">
      <span>{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-primary-500/15" aria-hidden="true">
        <i className="block h-full rounded-full bg-primary-500" style={{ width }} />
      </span>
      <b className="text-right">{num(score)}</b>
    </div>
  );
};

export default ReportScoreRow;
