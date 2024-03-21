
import Layout from '../../components/layout/Layout'
import HeroSection from '../../components/heroSection/HeroSection'
import Filter from '../../components/filter/Filter'
import ProductCard from '../../components/productCard/ProductCard'
import Track from '../../components/track/Track'
import { Link } from 'react-router-dom'
import UploadDocument from '../../components/upload/UploadDocument'

function Home() {
  return (
    <Layout>
      <HeroSection/>
      <Filter/>
      <UploadDocument/>
      <ProductCard/>
      <div className='flex justify-center -mt-10 mb-4'>
        <Link to={'/allproducts'}>
          <button className=' bg-gray-300 px-5 py-2 rounded-xl'>see more</button>
        </Link>
      </div>
      <Track/>
    </Layout>
  )
}

export default Home