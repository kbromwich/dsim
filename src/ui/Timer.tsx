import React from 'react';


interface Props {
  disabled?: boolean;
  startTime: Date;
  updateInterval?: number;
}

const Timer: React.FC<Props> = ({ disabled, startTime, updateInterval = 100 }) => {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    let interval: number | undefined;
    if (!disabled) {
      interval = window.setInterval(() => {
        setSeconds(() => (+new Date() - +startTime) / 1000);
      }, updateInterval);
    } else if (disabled && seconds !== 0) {
      window.clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [disabled, seconds, startTime, updateInterval]);
  return <span>{((+new Date() - +startTime) / 1000).toFixed(1)}</span>;
};

export default Timer;
