import { useState } from 'react';
import { DIFFICULTIES } from '../../content/difficulty';
import { text } from '../../content/text';
import { formatCents } from '../../engine/money';
import { SLOT_IDS, type Slot, type SlotId } from '../../save/slots';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import dialogStyles from '../components/Dialog.module.css';
import { GameIcon } from '../components/GameIcon';
import styles from './SlotsScreen.module.css';

interface SlotCardProps {
  id: SlotId;
  slot: Slot;
  onDelete: () => void;
}

function SlotCard({ id, slot, onDelete }: SlotCardProps) {
  const newGameIn = useGameStore((store) => store.newGameIn);
  const continueGame = useGameStore((store) => store.continueGame);
  const headingId = `slot-${id}-heading`;

  return (
    <li className={styles.slot} data-testid={`slot-${id}`} data-status={slot.status}>
      <h2 id={headingId} className={styles.slotName}>
        {text.slots.slot(id)}
      </h2>

      {slot.status === 'empty' ? (
        <>
          <p className={styles.detail}>{text.slots.empty}</p>
          <Button
            size="small"
            aria-label={text.slots.newGameLabel(id)}
            data-testid={`slot-${id}-new`}
            onClick={() => newGameIn(id)}
          >
            {text.slots.newGame}
          </Button>
        </>
      ) : null}

      {slot.status === 'saved' ? (
        <>
          <p className={styles.bakery}>
            <GameIcon id={slot.save.game.bakerLook} decorative size="large" />
            <span className={styles.grow}>
              <span className={styles.bakeryName} data-testid={`slot-${id}-name`}>
                {slot.save.game.bakeryName}
              </span>
              <span className={styles.detail} data-testid={`slot-${id}-summary`}>
                {text.slots.summary(
                  slot.save.game.day,
                  formatCents(slot.save.game.money),
                  DIFFICULTIES[slot.save.game.difficulty].name,
                )}
              </span>
            </span>
          </p>
          <div className={styles.buttons}>
            <Button
              size="small"
              aria-label={text.slots.playLabel(slot.save.game.bakeryName)}
              data-testid={`slot-${id}-continue`}
              onClick={() => continueGame(id)}
            >
              {text.slots.play}
            </Button>
            <Button
              size="small"
              variant="secondary"
              aria-label={text.slots.deleteLabel(slot.save.game.bakeryName)}
              data-testid={`slot-${id}-delete`}
              onClick={onDelete}
            >
              {text.slots.delete}
            </Button>
          </div>
        </>
      ) : null}

      {slot.status === 'damaged' ? (
        <>
          <p className={styles.detail} data-testid={`slot-${id}-damaged`}>
            {text.slots.damaged}
          </p>
          <Button
            size="small"
            variant="secondary"
            aria-label={`${text.slots.delete} ${text.slots.slot(id)}`}
            data-testid={`slot-${id}-delete`}
            onClick={onDelete}
          >
            {text.slots.delete}
          </Button>
        </>
      ) : null}
    </li>
  );
}

/** The three save slots: play a saved bakery, start a new one, or delete one. */
export function SlotsScreen() {
  const slots = useGameStore((store) => store.slots);
  const deleteSave = useGameStore((store) => store.deleteSave);
  const goTo = useGameStore((store) => store.goTo);
  const [deleting, setDeleting] = useState<SlotId | null>(null);

  const doomed = deleting === null ? null : slots[deleting];
  const doomedName =
    doomed?.status === 'saved' ? doomed.save.game.bakeryName : text.slots.damagedName;

  return (
    <section className={styles.screen} aria-labelledby="slots-heading">
      <div className={styles.top} inert={deleting !== null}>
        <h1 id="slots-heading" className={styles.heading}>
          {text.slots.heading}
        </h1>
        <p className={styles.intro}>{text.slots.intro}</p>
        <ul className={styles.list}>
          {SLOT_IDS.map((id) => (
            <SlotCard key={id} id={id} slot={slots[id]} onDelete={() => setDeleting(id)} />
          ))}
        </ul>
      </div>

      <div className={styles.actions} inert={deleting !== null}>
        <Button variant="secondary" onClick={() => goTo('title')} data-testid="slots-back">
          {text.slots.back}
        </Button>
      </div>

      {deleting !== null ? (
        <Dialog
          alert
          heading={text.slots.confirmHeading(doomedName)}
          onEscape={() => setDeleting(null)}
          testId="delete-dialog"
        >
          <p className={dialogStyles.body}>{text.slots.confirmBody}</p>
          {/* Keeping comes first, so a slip of the thumb or the Enter key never deletes. */}
          <Button onClick={() => setDeleting(null)} data-testid="delete-cancel">
            {text.slots.keep}
          </Button>
          <Button
            variant="secondary"
            data-testid="delete-confirm"
            onClick={() => {
              deleteSave(deleting);
              setDeleting(null);
            }}
          >
            {text.slots.confirmDelete}
          </Button>
        </Dialog>
      ) : null}
    </section>
  );
}
