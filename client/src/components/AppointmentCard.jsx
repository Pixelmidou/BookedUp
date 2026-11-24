import { Check, ChevronDown, X } from "lucide-react";
import { initials, today } from "../utils.js";

const statuses = [
  "Pending",
  "Approved",
  "Arrived",
  "Done",
  "Rejected",
  "Cancelled",
];

// Show actions permitted for the signed-in role; the API enforces them too.
export default function AppointmentCard({
  item,
  index,
  user,
  onStatus,
  onDelete,
}) {
  const colors = ["peach", "lilac", "aqua", "yellow", "pink"];
  const owner = user.role === "owner";
  const workerCanUpdate =
    user.role === "worker" && ["Approved", "Arrived"].includes(item.status);
  const choices = owner
    ? statuses.slice(1)
    : item.status === "Approved"
      ? ["Approved", "Arrived", "Done"]
      : ["Arrived", "Done"];
  return (
    <article className="appointment-row">
      <div className="time-col">
        <b>{item.time}</b>
        <span>
          {item.date !== today()
            ? new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "Today"}
        </span>
      </div>
      <div className={`timeline-dot ${colors[index % colors.length]}`} />
      <div className={`client-avatar ${colors[index % colors.length]}`}>
        {initials(item.customer)}
      </div>
      <div className="client-details">
        <div className="client-heading">
          <h3>{item.customer}</h3>
          <span className={`status-pill ${item.status.toLowerCase()}`}>
            <i />
            {item.status}
          </span>
        </div>
        <p>
          {item.service}
          {item.phone && (
            <>
              <span className="middot">·</span>
              {item.phone}
            </>
          )}
        </p>
        <small className="activity-line">
          Added by {item.createdBy?.name || "workspace"}
          {item.updatedBy?.name && item.updatedBy.name !== item.createdBy?.name
            ? ` · Last updated by ${item.updatedBy.name}`
            : ""}
        </small>
        {item.note && <small className="client-note">“{item.note}”</small>}
      </div>
      <div className="row-actions">
        {owner && item.status === "Pending" ? (
          <>
            <button
              className="approve-btn"
              onClick={() => onStatus(item, "Approved")}
            >
              <Check size={13} />
              Approve
            </button>
            <button
              className="reject-btn"
              onClick={() => onStatus(item, "Rejected")}
            >
              Reject
            </button>
          </>
        ) : (owner || workerCanUpdate) &&
          !["Done", "Rejected", "Cancelled"].includes(item.status) ? (
          <label className="move-status">
            Update <ChevronDown size={13} />
            <select
              aria-label={`Update ${item.customer} appointment`}
              value={item.status}
              onChange={(e) => onStatus(item, e.target.value)}
            >
              {choices.map((choice) => (
                <option key={choice}>{choice}</option>
              ))}
            </select>
          </label>
        ) : null}
        {owner && (
          <button
            className="delete-btn"
            title="Delete appointment"
            onClick={() => onDelete(item)}
          >
            <X size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
