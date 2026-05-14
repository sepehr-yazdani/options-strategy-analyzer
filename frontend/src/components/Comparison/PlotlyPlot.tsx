import { useEffect, useRef } from "react";
import Plotly from "plotly.js/dist/plotly";

interface PlotProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
}

export default function Plot({ data, layout, config, style }: PlotProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    Plotly.react(ref.current, data, layout as Plotly.Layout, config);
    return () => {
      if (ref.current) Plotly.purge(ref.current);
    };
  }, [data, layout, config]);

  return <div ref={ref} style={style} />;
}
