import Image from "next/image";
import { useEffect } from "react";

interface StatsCardProps {
  icon: any;        // path to image
  value: number | string;
  label: string;
  loading: boolean;
}

export default function StatsCard({ icon, value, label, loading }: StatsCardProps) {

  return (
    <div className="rounded-2xl shadow-sm flex flex-column items-start" style={{
      width: '149px',
      height: '120px',
      background: '#F9FAFC',
      flexDirection: 'column',
      border: '1px solid #E5E7EB',
    }}>
      <div className="gap-2" style={{ height: '89px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '10px' }}>
        {/* Icon */}
        <div className="w-10 h-10 relative">
          <Image src={icon} alt={label} />
        </div>

        {/* Text block */}
        {loading ? <div className="flex justify-center items-center">
          <img
            src="/images/gif/QRbase-claim-links-work.gif"
            alt="Loading..."
            className="w-10 h-10 object-contain"
          />
        </div> : <div className="text-[24px] text-black" style={{ fontFamily: 'Inter', fontWeight: '700' }}>{value}</div>}

        <div style={{ fontFamily: 'Inter', fontSize: '10px', fontWeight: '600', color: "#6B7280" }}>{label}</div>
      </div>
    </div>
  );
}