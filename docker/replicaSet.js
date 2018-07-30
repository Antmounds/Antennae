//rs.initiate();
cfg = {
    _id: 'rs0',
    members: [
        { _id: 0, host: 'localhost', priority: 10}
    ],
    settings: {
	    electionTimeoutMillis: 3000,
	    catchUpTimeoutMillis: 3000,
	    catchUpTakeoverDelayMillis: 2000,
	}
}
//rs.reconfig(cfg);
rs.initiate(cfg);