import { Alchemy, Network } from 'alchemy-sdk';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useParams } from 'react-router-dom';
import './App.css';

const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);
const WEI = 1000000000000000000;

function App() {
  const [blockNumber, setBlockNumber] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const blocksPerPage = 20;

  useEffect(() => {
    async function fetchLatestBlockNumber() {
      const latestBlock = await alchemy.core.getBlockNumber();
      setBlockNumber(latestBlock);
    }

    fetchLatestBlockNumber();

    const intervalId = setInterval(fetchLatestBlockNumber, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    async function fetchBlocks() {
      const endBlock = blockNumber - (currentPage - 1) * blocksPerPage;
      const startBlock = Math.max(endBlock - blocksPerPage + 1, 0);
      const blockPromises = [];

      for (let i = endBlock; i >= startBlock; i--) {
        blockPromises.push(alchemy.core.getBlock(i));
      }

      const fetchedBlocks = await Promise.all(blockPromises);
      setBlocks(fetchedBlocks);
    }

    if (blockNumber > 0) {
      fetchBlocks();
    }
  }, [blockNumber, currentPage]);

  const totalPages = Math.ceil(blockNumber / blocksPerPage);

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/">
            <>
              <h1>Ethereum Blocks | Latest Block : {blockNumber}</h1>
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                &nbsp;
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                &nbsp;
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
              <br/>
              <div>
                <center>
                  <table>
                    <thead>
                      <tr>
                        <th>Block</th>
                        <th>Timestamp</th>
                        <th>Num of Txns</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map(block => (
                        <tr key={block.number}>
                          <td>{block.number}</td>
                          <td>{new Date(block.timestamp * 1000).toLocaleString()}</td>
                          <td>{block.transactions.length}</td>
                          <td>
                            <Link to={`/block/${block.number}`}>
                              <button>View Block Details</button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </center>
              </div>
              <br/>
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                &nbsp;
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                &nbsp;
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          </Route>
          <Route path="/block/:blockNumber" component={BlockDetails} />
        </Switch>
      </div>
    </Router>
  );
}

function BlockDetails() {
  const { blockNumber } = useParams();
  const [block, setBlock] = useState(null);

  useEffect(() => {
    async function fetchBlockDetails() {
      const block = await alchemy.core.getBlockWithTransactions(Number(blockNumber));
      console.log(block)
      setBlock(block);
    }

    fetchBlockDetails();
  }, [blockNumber]);

  if (!block) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Link to="/">Back to Blocks</Link>
      <h2>Block {block.number}</h2>
      <p>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</p>
      <p>Total of {block.transactions.length} Transactions:</p>
      <center>
        <table>
          <thead>
            <tr>
              <th>Hash</th>
              <th>Block</th>
              <th>From</th>
              <th>To</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {block.transactions.map(tx => (
              <tr key={tx.hash}>
                <td>{tx.hash.substring(0, 10)}...</td>
                <td>{tx.blockNumber}</td>
                <td>{tx.from.substring(0, 10)}...{tx.from.substring(tx.from.length - 10)}</td>
                <td>{tx.to.substring(0, 10)}...{tx.to.substring(tx.to.length - 10)}</td>
                <td>{parseFloat(parseInt(tx.value._hex, 16)/WEI)} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>
      </center>
    </div>
  );
}

export default App;
