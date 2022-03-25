const iterationScale = (value: number) => {
  const floor = Math.floor(value);
  const floorPow = 10 ** floor;
  const ceilPow = 10 ** Math.ceil(value);
  return Math.round(floorPow + (value - floor) * ceilPow);
}

export default iterationScale;
