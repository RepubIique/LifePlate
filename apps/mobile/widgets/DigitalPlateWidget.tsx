import type { DigitalPlateWidgetProps } from "@lifeplate/shared";

type WidgetHandle = {
  updateSnapshot: (props: DigitalPlateWidgetProps) => void;
  updateTimeline: (
    entries: { date: Date; props: DigitalPlateWidgetProps }[],
  ) => void;
  reload: () => void;
};

const noopWidget: WidgetHandle = {
  updateSnapshot: () => {},
  updateTimeline: () => {},
  reload: () => {},
};

export default noopWidget;
