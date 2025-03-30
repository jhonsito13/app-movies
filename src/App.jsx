
import { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import React from 'react';
import Spinner from './components/Spinner.jsx';  // Asegúrate de que el archivo existe
import MovieCard from './components/MovieCard.jsx';
import { useDebounce} from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js';


const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`, 
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [moviesList, setMovieList] = useState([]);  
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearch] = useState('')

  useDebounce(() => setDebouncedSearch(searchTerm), 500, [searchTerm])

  const fetchMovies = async ( query ='') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`; 
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json();
      if (data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);  

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);  
      setErrorMessage(`Error fetching movies. Please try again later.`);  
    } finally {
      setIsLoading(false)
    }
  }

 const loadTrendingMovies = async () => {
    try{
      const movies = await getTrendingMovies();
      console.log("🎬 Trending Movies desde Appwrite:", movies);
      setTrendingMovies(movies);
    }catch(error){
      console.error(`Error fetching trending movies: ${error}`);
     
    }
 }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  useEffect(() => {
    loadTrendingMovies();
  }, []);


  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1 className='mt-'>Find<span className="text-gradient">Movies</span> You'll Enjoy the Hassle</h1>
        </header>

        {trendingMovies.length > 0 &&(
          <section className="trending">
            <h2>Trending Movies</h2>
          <ul>
            {trendingMovies.map((movie,index) => (
              <li key={movie.$id}>
                <p>{index +1}</p>
                <img src={movie.poster_url} alt={movie.title} />
                <p>{movie.title}</p>
               
              </li>
            ))}
          </ul>
          </section>
        )}
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <section className="all-movies">
          <h2 >All Movies</h2>
          {isLoading ? (
            <Spinner/>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {moviesList.map((movie) => (
              <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
