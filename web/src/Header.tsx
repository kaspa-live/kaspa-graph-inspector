import {AppBar, IconButton, makeStyles, Toolbar, Typography} from "@material-ui/core";
import Logo from "./Logo";
import FastForwardIcon from '@material-ui/icons/FastForward';
import Dag from "./dag/Dag";

const Header = ({isTrackingState, dag}: { isTrackingState: boolean, dag: Dag | undefined }) => {
    const classes = useStyles();

    return (
        <AppBar position="static">
            <Toolbar>
                <Logo/>
                <Typography variant="h6" className={classes.title}>
                    Kaspa Graph Inspector
                </Typography>
                <div className={classes.grow}/>
                {isTrackingState ? undefined :
                    <IconButton color="inherit" onClick={() => (dag as Dag).setStateTrackHead()}>
                        <FastForwardIcon/>
                    </IconButton>
                }
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
    }
}));

export default Header;
