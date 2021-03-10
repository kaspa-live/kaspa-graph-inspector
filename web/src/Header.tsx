import {AppBar, IconButton, makeStyles, Toolbar, Typography} from "@material-ui/core";
import Logo from "./Logo";
import FastForwardIcon from '@material-ui/icons/FastForward';

const Header = ({appState, setAppState}: any) => {
    const classes = useStyles();

    return (
        <AppBar position="static">
            <Toolbar>
                <Logo/>
                <Typography variant="h6" className={classes.title}>
                    Kaspa Graph Inspector
                </Typography>
                <div className={classes.grow}/>
                {appState.isTracking ? undefined :
                    <IconButton color="inherit">
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
