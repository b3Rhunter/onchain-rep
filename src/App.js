import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAbi from './abi.json';

const abi = contractAbi;
const contractAddress = '0x5c13b0FB8BAD9765A1C9c46aACbC394b915C4369';

function App() {

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const [reviewedAddress, setReviewedAddress] = useState('');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);

  const [post, setPost] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        const signer = web3Provider.getSigner();
        setSigner(signer);
        const contract = new ethers.Contract(contractAddress, abi, signer);
        setContract(contract);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    };
    init();
  }, []);

  const addReview = async () => {
    try {
      const tx = await contract.addReview(reviewedAddress, rating, comment);
      await tx.wait();
      alert('Review added successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to add review.');
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewCount = (await contract.getReviews(reviewedAddress)).length;
      const fetchedReviews = [];
      for (let i = 0; i < reviewCount; i++) {
        const review = await contract.getReview(reviewedAddress, i);
        fetchedReviews.push(review);
      }
      setReviews(fetchedReviews);
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

      <div className='allReviews'>
      <h2>Reviews</h2>
      <div>
        {reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <div>
            {reviews.map((review, index) => (
              <div key={index}>
                <p>Rating: {review.rating}</p>
                <p>Comment: {review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>

      <div className='postReview'>
        <button onClick={makePost}>+</button>
      </div>
    </>
  );
}

export default App;
