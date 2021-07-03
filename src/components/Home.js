import React, { useContext, useEffect, useState } from 'react'
import {
  CircularProgress,
  List,
  Paper
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import AppContext from '../AppContext'
import { getDistance } from '../utils'
import SuccinctTimeReport from './home/SuccinctTimeReport'
import { useTranslation } from 'react-i18next'

const Home = () => {
  const { 
    AppTitle,
    hotRoute, savedEtas, routeList, stopList
  } = useContext ( AppContext )
  const { t } = useTranslation()

  const [selectedRoutes, setSelectedRoute] = useState(
    savedEtas.concat(
      Object.entries(hotRoute).filter(([route, count]) => count > 5)
      .sort((a,b) => b[1] - a[1])
      .map(([routeId]) => routeId)
    ).filter((routeId, index, self) => self.indexOf(routeId) === index)
    .slice(0,20)
  )
  const [doneGeoRoutes, setDoneGeoRoutes] = useState(false)

  useEffect (() => {
    document.title = t(AppTitle)
    document.querySelector('meta[name="description"]').setAttribute("content", t('巴士到站預報 App，一 App 盡覽九巴、龍運、新巴、城巴、嶼巴巴士路線、車費及到站預報'))
    let isMounted = true
    // to enhance performance, we used cached geolocation
    const geolocation = JSON.parse(localStorage.getItem('geolocation'))
    
    Object.entries(stopList).map(stop =>
      // potentially could be optimized by other distance function
      stop.concat(getDistance(stop[1].location, geolocation))
    ).filter(stop => 
      // keep only nearby 1000m stops
      stop[2] < 1000
    ).sort((a, b) => 
      a[2] - b[2]
    ).slice(0, 5).forEach(([stopId]) => {
      // keep only max. 5 stops
      let routeIds = []
      Object.entries(routeList).forEach(([key, route]) => {  
        ['kmb', 'nwfb', 'ctb'].forEach(co => {
          if (route.stops[co] && route.stops[co].includes(stopId)) {
            routeIds.push(key+'/'+route.stops[co].indexOf(stopId))
          }
        })
      })
  
      // add nearby routes to display
      if ( isMounted ) {
        setSelectedRoute(prevSelectedRoutes => 
          prevSelectedRoutes.concat(
            routeIds.map(routeId => {
              setDoneGeoRoutes(true)
              return routeId
            })
          ).filter( (v, i, s) => s.indexOf(v) === i ).slice(0,20)
        )
      }
    })
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const classes = useStyles()
  return (
    <Paper className={classes.root}>
      <List className={classes.list}>
      {
        selectedRoutes.map( selectedRoute => (
          <SuccinctTimeReport key={selectedRoute} routeId={selectedRoute} />
         ) )
      }
      </List>
      {
        !doneGeoRoutes ? <CircularProgress size={20} /> : <></>
      }
    </Paper>
  )
}

export default Home

const useStyles = makeStyles ( theme => ({
  root: {
    background: 'white',
    height: 'calc(100vh - 120px)',
    overflowY: 'scroll',
    textAlign: 'center'
  }
}))

