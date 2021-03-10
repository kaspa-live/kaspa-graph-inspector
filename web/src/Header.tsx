import {AppBar, makeStyles, Toolbar, Typography} from "@material-ui/core";
import Logo from "./Logo";

const Header = ({appState, setAppState}: any) => {
    const classes = useStyles();

    return (
        <AppBar position="static">
            <Toolbar>
                <Logo/>
                <Typography variant="h6" className={classes.title}>
                    Kaspa Graph Inspector {appState.isTracking ? "aaaa" : "bbbb"}
                </Typography>
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
}));

export default Header;
