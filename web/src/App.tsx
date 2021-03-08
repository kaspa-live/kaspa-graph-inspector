import './App.css';
import Canvas from "./Canvas";
import {AppBar, makeStyles, Toolbar, Typography} from "@material-ui/core";
import Logo from "./Logo";

const App = () => {
    const classes = useStyles();

    return (
        <div className="container">
            <AppBar position="static">
                <Toolbar>
                    <Logo/>
                    <Typography variant="h6" className={classes.title}>
                        Kaspa Grapher
                    </Typography>
                </Toolbar>
            </AppBar>
            <Canvas/>
        </div>
    );
}

const useStyles = makeStyles((theme) => ({
    title: {
        flexGrow: 1,
        marginTop: 5,
        marginLeft: 10,
    },
}));

export default App;
