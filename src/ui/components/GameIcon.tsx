import { getAsset, type AssetId } from '../../assets';
import styles from './GameIcon.module.css';

interface GameIconProps {
  id: AssetId;
  /** Hide from screen readers when a visible word next to the icon already says the same. */
  decorative?: boolean;
  size?: 'small' | 'medium' | 'large' | 'huge';
}

/** Renders an asset from the asset layer, as emoji today and an image later. */
export function GameIcon({ id, decorative = false, size = 'medium' }: GameIconProps) {
  const asset = getAsset(id);
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': asset.label };
  const className = `${styles.icon} ${styles[size]}`;

  if (asset.kind === 'image') {
    return <img className={className} src={asset.src} alt={decorative ? '' : asset.label} />;
  }
  return (
    <span className={className} {...a11y}>
      {asset.emoji}
    </span>
  );
}
