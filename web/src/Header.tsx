import {AppBar, makeStyles, Toolbar, Typography} from "@material-ui/core";
import Logo from "./Logo";
import Dag from "./dag/Dag";
import {useState} from "react";
import TrackButton from "./components/TrackButton";
import ConnectionIssuesIndicator from "./components/ConnectionIssuesIndicator";

const Header = ({dag}: { dag: Dag }) => {
    const classes = useStyles();

    const [isTrackingState, setTrackingState] = useState(true);
    const [isHavingConnectionIssuesState, setHavingConnectionIssuesState] = useState(false);

    dag.setIsTrackingChangedListener(isTracking => setTrackingState(isTracking));
    dag.setIsFetchFailingListener(isFailing => setHavingConnectionIssuesState(isFailing));

    return (
        <AppBar position="static">
            <Toolbar>
                <Logo/>
                <Typography variant="h6" className={classes.title}>
                    Kaspa Graph Inspector
                </Typography>
                <div className={classes.grow}/>
                {isHavingConnectionIssuesState ? <ConnectionIssuesIndicator/> : undefined}
                {isTrackingState ? undefined : <TrackButton onClick={() => dag.setStateTrackHead()}/>}
            </Toolbar>
        </AppBar>
    );
};

const useStyles = makeStyles((theme) => ({
    title: {
        flexGrow: 1,
        marginTop: 5,
        marginLeft: 10,
    },
    grow: {
        flexGrow: 1,
    },
}));

export default Header;
