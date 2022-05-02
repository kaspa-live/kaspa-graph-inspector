import { Box } from "@mui/material";
import { useState } from "react";
import Dag from "../../dag/Dag";
import ZoomItem from "../base/ZoomItem";
import ConnectionIssuesIndicator from "./ConnectionIssuesIndicator";
import KaspaLogo from "./KaspaButton";
import SearchButton from "./SearchButton";
import TrackButton from "./TrackButton";

const Sidebar = ({dag}: {dag: Dag}) => {
    const [isTrackingState, setTrackingState] = useState(true);
    const [isHavingConnectionIssuesState, setHavingConnectionIssuesState] = useState(false);
    
    dag.setIsTrackingChangedListener(isTracking => setTrackingState(isTracking));
    dag.setIsFetchFailingListener(isFailing => setHavingConnectionIssuesState(isFailing));

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px',
            position: 'absolute',
            top: '2vw',
            bottom: '2vw',
            right: '2.5vw',
            width: '92px',
        }}>
            <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                <KaspaLogo />
            </Box>

            <ZoomItem visible={isHavingConnectionIssuesState}>
                <ConnectionIssuesIndicator/>
            </ZoomItem>

            <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                <ZoomItem visible={true}>
                    <SearchButton onClick={() => {}}/>
                </ZoomItem>
                <ZoomItem visible={true}>
                    <TrackButton isTracking={isTrackingState} onClick={() => isTrackingState ? dag.setStateTrackCurrent() : dag.setStateTrackHead()}/>
                </ZoomItem>
            </Box>
        </Box>
    );
}

export default Sidebar;