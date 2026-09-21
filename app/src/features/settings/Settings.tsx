import { useState } from "react";
import FinePrint from "../../components/FinePrint/FinePrint";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";
import Section from "../../components/Section/Section";
import SectionTitle from "../../components/SectionTitle/SectionTitle";
import { usePlayerStore } from "../../store/player/usePlayerStore";
import useSettings from "../../store/settings/useSettings";
import Button from "../../ui/buttons/Button/Button";
import Modal from "../../ui/overlay/Modal/Modal";
import styles from "./Settings.module.scss";
import ToggleRow from "./ToggleRow/ToggleRow";

const Settings = () => {
	/*
	 * One slice each. Selecting the whole store returns a fresh object on every
	 * `set`, so this screen re-rendered on any settings change rather than only
	 * on the ones it shows — and it would keep doing so for fields added later
	 * that it never reads.
	 *
	 * Both stores expose a `reset`, and they do very different things: one clears
	 * three switches, the other wipes the save. Named apart here so a call site
	 * cannot confuse them.
	 */
	const haptics = useSettings((state) => state.haptics);
	const music = useSettings((state) => state.music);
	const sfx = useSettings((state) => state.sfx);
	const resetSettings = useSettings((state) => state.reset);

	const best = usePlayerStore((state) => state.best);
	const coins = usePlayerStore((state) => state.coins);
	const wipeProgress = usePlayerStore((state) => state.reset);
	const [confirming, setConfirming] = useState(false);

	return (
		<>
			<ScreenHeader title="SETTINGS" />

			<Section>
				<div className={styles.head}>
					<SectionTitle>AUDIO &amp; FEEL</SectionTitle>

					<Button
						data-reset-settings
						onClick={resetSettings}
						size="small"
						variant="secondary"
					>
						RESET SETTINGS
					</Button>
				</div>

				<ToggleRow flag="music" label="MUSIC" on={music} />
				<ToggleRow flag="sfx" label="SOUND FX" on={sfx} />
				<ToggleRow flag="haptics" label="HAPTICS" on={haptics} />
				<p className={styles.note}>
					No audio ships yet &mdash; the original files had unclear licensing
					and were removed.
				</p>
			</Section>

			<Section>
				<SectionTitle>STEERING</SectionTitle>
				<p className={styles.note}>
					Touch anywhere and drag. The car moves as far as your thumb does, so
					you can hold low and wide of it and still see the road ahead.
				</p>
			</Section>

			<div className={styles.danger}>
				<Button data-reset onClick={() => setConfirming(true)} variant="danger">
					RESET PROGRESS
				</Button>
        
				<FinePrint>BURNING RUBBER &middot; V2.0.0</FinePrint>
			</div>

			{confirming ? (
				<Modal
					onClose={() => setConfirming(false)}
					title="RESET PROGRESS?"
					tone="danger"
				>
					<p className={styles.copy}>
						This erases your best score of <b>{best.toLocaleString()}</b>,{" "}
						<b>{coins.toLocaleString()} coins</b>, and every car you have
						unlocked.
					</p>
					<p className={styles.warn} data-warn>
						THIS CANNOT BE UNDONE
					</p>
					<div className={styles.actions}>
						{/* the safe action is the primary; destroying takes the deliberate tap */}
						<Button onClick={() => setConfirming(false)}>KEEP MY PROGRESS</Button>
						<Button
							onClick={() => {
								wipeProgress();
								setConfirming(false);
							}}
							variant="danger"
						>
							RESET EVERYTHING
						</Button>
					</div>
				</Modal>
			) : null}
		</>
	);
};

export default Settings;
