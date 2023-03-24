import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAbi from './abi.json';

const abi = contractAbi;
const contractAddress = '0x1b6f42caCE1F60F55AB91BEF8944d5eeD8998812';

function App() {

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const [reviewedAddress, setReviewedAddress] = useState('');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [allReviews, setAllReviews] = useState({});
  const [searched, getSearched] = useState(false)

  const [post, setPost] = useState(false)
  const [connected, setConnect] = useState(false)
  const [name, setName] = useState("")
  const [searchedAddress, setSearchedAddress] = useState("");



  const connect = async () => {
    try {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        const signer = web3Provider.getSigner();
        setSigner(signer);
        const chain = await signer.getChainId()
        console.log(chain)
          if (chain !== 84531) {
            alert("Please switch to Base Goerli network!")
          }
        const contract = new ethers.Contract(contractAddress, abi, signer);
        setContract(contract);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const { ethereum } = window;
        if(ethereum) {
          const ensProvider = new ethers.providers.InfuraProvider('mainnet');
          const address = await signer.getAddress();
          const displayAddress = address?.substr(0, 6) + "...";
          const ens = await ensProvider.lookupAddress(address);
          if (ens !== null) {
            setName(ens)
          } else {
            setName(displayAddress)
          }
        }
        setConnect(true)
      }
    } catch (error) {
      console.log(error.message)
    }
}

const getDisplayName = async (address) => {
  const ensProvider = new ethers.providers.InfuraProvider('mainnet');
  const ens = await ensProvider.lookupAddress(address);
  if (ens !== null) {
    return ens;
  } else {
    return address.substr(0, 6) + '...';
  }
};


const fetchAllReviews = async () => {
  try {
    const reviewedAddresses = await contract.getReviewedAddresses();
    const allFetchedReviews = {};

    for (const addr of reviewedAddresses) {
      const reviewCount = (await contract.getReviews(addr)).length;
      const fetchedReviews = [];

      for (let i = 0; i < reviewCount; i++) {
        const review = await contract.getReview(addr, i);
        fetchedReviews.push(review);
      }

      const displayName = await getDisplayName(addr);
      allFetchedReviews[displayName] = fetchedReviews;
    }

    setAllReviews(allFetchedReviews);
  } catch (error) {
    console.error(error);
    alert('Failed to fetch all reviews.');
  }
};



  const addReview = async () => {
    try {
      const tx = await contract.addReview(reviewedAddress, rating, comment);
      await tx.wait();
      await fetchAllReviews()
      alert('Review added successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to add review.');
    }
  };

  const resolveENS = async (nameOrAddress) => {
    const ensProvider = new ethers.providers.InfuraProvider('mainnet');
    try {
      const resolvedAddress = await ensProvider.resolveName(nameOrAddress);
      if (resolvedAddress === null) {
        throw new Error('ENS name not found');
      }
      return resolvedAddress;
    } catch (error) {
      // If it's not an ENS name, return the input value assuming it's an address
      return nameOrAddress;
    }
  };

  const fetchReviews = async () => {
    try {
      const resolvedAddress = await resolveENS(reviewedAddress);
      const displayName = await getDisplayName(resolvedAddress);
      setSearchedAddress(displayName);
      const reviewCount = (await contract.getReviews(resolvedAddress)).length;
      const fetchedReviews = [];
      for (let i = 0; i < reviewCount; i++) {
        const review = await contract.getReview(resolvedAddress, i);
        fetchedReviews.push(review);
      }
      setReviews(fetchedReviews);
      getSearched(true);
    } catch (error) {
      console.error(error);
      alert('Failed to fetch reviews.');
    }
  };
  


  

  function makePost() {
    setPost(true);
  }

  function closePost() {
    setPost(false)
  }

  function closeSearch() {
    getSearched(false)
  }

  useEffect(() => {
    if (connected && contract) {
      fetchAllReviews();
    }
  }, [connected, contract]);

  return (
    <><div>
      <h1>On-chain Reputation</h1>

      {post && (
        <div className='review'>
          <div className='postClose'>
          <button className='postCloseBtn' onClick={closePost}>X</button>
          </div>
          <h3>Add a Review</h3>
          <div>
          
            <div>
              <input
                type="text"
                placeholder="ENS name or wallet address"
                value={reviewedAddress}
                onChange={(e) => setReviewedAddress(e.target.value)} />
            </div>

            <div>
              <input
                type="number"
                min="1"
                max="5"
                placeholder="Rating (1-5)"
                value={rating}
                onChange={(e) => setRating(e.target.value)} />
            </div>

            <div>
              <textarea
                placeholder="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>

            <div>
              <button onClick={addReview}>Add Review</button>
            </div>

          </div>
        </div>
      )}


      <div className='fetchReviews'>
      <h4>Fetch Reviews</h4>
      <div>
        <div>
        <input
          type="text"
          placeholder="ENS name or wallet address"
          value={reviewedAddress}
          onChange={(e) => setReviewedAddress(e.target.value)} />
        </div>
        <button onClick={fetchReviews}>Fetch Reviews</button>
      </div>
      </div>

{searched && (
      <div className='searchReviews'>
        <h3>search results for {searchedAddress}...</h3>
        
      <div>
        {reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <div>
            {reviews.map((review, index) => (
              <div className='searchedReviews' key={index}>
                <p>Rating: {review.rating}</p>
                <p>Comment: {review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className='closeSearch' onClick={closeSearch}>close search</button>
      <hr></hr>
    </div>
)}

    </div>

    <div className='allReviews'>
    </div>
    <div>
      {Object.keys(allReviews).length === 0 ? (
        <p>No reviews found.</p>
      ) : (
        Object.entries(allReviews).map(([addr, reviews]) => (
          <div className='singleReview' key={addr}>
            <h3>Reviews for {addr}</h3>
            {reviews.map((review, index) => (
              <div key={index}>
                <p>Rating: {review.rating}</p>
                <p>Comment: {review.comment}</p>
              </div>
            ))}
          </div>
        ))
      )}
    </div>

      <div className='postReview'>
        <button onClick={makePost}>+</button>
      </div>
      <div className='connect'>
        <button className='connectBtn' onClick={connect}>
          {!connected && (
            <p>connect</p>
          )}
          {connected && (
            <p>{name}</p>
          )}
        </button>
      </div>
    </>
  );
}

export default App;
