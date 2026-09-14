import { useNavigate } from "react-router-dom";
import FinePrint from "../../components/FinePrint/FinePrint";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";
import Section from "../../components/Section/Section";
import SectionTitle from "../../components/SectionTitle/SectionTitle";
import useSettings from "../../store/useSettings/useSettings";
import Button from "../../ui/buttons/Button/Button";
import styles from "./Settings.module.scss";
import ToggleRow from "./ToggleRow/ToggleRow";

const Settings = () => {
	const navigate = useNavigate();
	const { haptics, music, sfx, reset } = useSettings((state) => state);

	return (
		<>
			<ScreenHeader title="SETTINGS" />

			<Section>
				<div className={styles.head}>
					<SectionTitle>AUDIO &amp; FEEL</SectionTitle>

					<Button
						data-reset-settings
						onClick={() => reset()}
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
				<Button data-reset onClick={() => navigate("reset")} variant="danger">
					RESET PROGRESS
				</Button>
        
				<FinePrint>BURNING RUBBER &middot; V2.0.0</FinePrint>
			</div>
		</>
	);
};

export default Settings;
