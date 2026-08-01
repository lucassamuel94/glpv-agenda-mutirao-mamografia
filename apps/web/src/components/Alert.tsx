"use client";

import React from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import {
  ALERT_ICON_BG_COLORS,
  ALERT_ICON_COMPONENTS,
  ALERT_ICON_TEXT_COLORS,
  type AlertVisualType,
} from "./alert-styles";

interface AlertProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertVisualType;
  confirmText?: string;
}

export const Alert: React.FC<AlertProps> = ({
  open,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
}) => {
  const Icon = ALERT_ICON_COMPONENTS[type];

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <Button onClick={onClose} variant="primary" size="md">
          {confirmText}
        </Button>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`${ALERT_ICON_BG_COLORS[type]} p-2 rounded-lg flex-shrink-0`}
        >
          <Icon className={`h-5 w-5 ${ALERT_ICON_TEXT_COLORS[type]}`} />
        </div>
        <p className="text-sm text-foreground flex-1">{message}</p>
      </div>
    </Dialog>
  );
};
