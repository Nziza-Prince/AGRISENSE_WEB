import {
  ArchiveRestore,
  Ban,
  KeyRound,
  Lock,
  MailCheck,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import Tip from "./Tip";
import { IconAction } from "./IconAction";

export interface RowHandlers {
  suspend: () => void;
  reactivate: () => void;
  ban: () => void;
  unban: () => void;
  verify: () => void;
  reset: () => void;
  changeRole: () => void;
  remove: () => void;
  restore: () => void;
}

const Spacer = () => <span className="h-8 w-8" aria-hidden />;

/**
 * Six fixed slots, always in the same place, so every row lines up.
 * Slot 1 pause/resume · 2 ban/unban · 3 verify email · 4 reset password · 5 change role · 6 delete.
 */
export default function UserRowActions({
  status,
  locked,
  on,
}: {
  status: string;
  locked: boolean;
  on: RowHandlers;
}) {
  if (locked) {
    return (
      <Tip text="Protected account">
        <span className="flex h-8 w-8 items-center justify-center text-gray-300">
          <Lock className="h-4 w-4" />
        </span>
      </Tip>
    );
  }
  if (status === "DELETED") {
    return (
      <div className="flex items-center gap-0.5">
        <IconAction icon={ArchiveRestore} label="Restore user" tone="good" onClick={on.restore} />
      </div>
    );
  }
  const banned = status === "BANNED";
  const suspended = status === "SUSPENDED";
  return (
    <div className="flex items-center gap-0.5">
      {banned ? (
        <Spacer />
      ) : suspended ? (
        <IconAction icon={PlayCircle} label="Reactivate" tone="good" onClick={on.reactivate} />
      ) : (
        <IconAction icon={PauseCircle} label="Suspend" tone="warn" onClick={on.suspend} />
      )}
      {banned ? (
        <IconAction icon={ShieldCheck} label="Unban" tone="good" onClick={on.unban} />
      ) : (
        <IconAction icon={Ban} label="Ban" tone="danger" onClick={on.ban} confirm />
      )}
      <IconAction icon={MailCheck} label="Verify email" tone="brand" onClick={on.verify} />
      <IconAction icon={KeyRound} label="Reset password" tone="neutral" onClick={on.reset} />
      <IconAction icon={UserCog} label="Change role" tone="brand" onClick={on.changeRole} />
      <IconAction icon={Trash2} label="Delete user" tone="danger" onClick={on.remove} confirm />
    </div>
  );
}
