import React, {useContext, useState, useEffect} from 'react'
import { ListItemText, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { fetchEtas } from 'hk-bus-eta'
import AppContext from '../../AppContext'

const Etas = ({routeId}) => {
  const { t, i18n } = useTranslation()
  const { db: {routeList} } = useContext ( AppContext )
  const [ routeNo, serviceType ] = routeId.split('-')
  const [ routeKey, seq ] = routeId.split('/')
  const { co, stops, bound, nlbId } = routeList[routeKey] || DefaultRoute
  const [ etas, setEtas ] = useState(null)
  useStyles()

  useEffect(() => {
    let isMounted = true
    
    const fetchData = () => {
      if ( navigator.userAgent === 'prerendering' ){
        // skip if prerendering
        setEtas(null)
        return new Promise((resolve) => resolve())
      }
      return fetchEtas({
        route: routeNo, routeStops: stops, seq: parseInt(seq, 10), bound, serviceType, co, nlbId
      }).then ( _etas => {
        if (isMounted) setEtas(_etas)
      })
    }
    
    const fetchEtaInterval = setInterval(() => {
      fetchData()
    }, 30000)

    fetchData()

    return () => {
      isMounted = false
      clearInterval(fetchEtaInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getEtaString = (eta) => {
    if ( !eta ) return ''
    else {
      const waitTime = Math.round(((new Date(eta.eta)) - (new Date())) / 60 / 1000)
      if ( waitTime < 1 ) {
        return '- '+t('分鐘')
      } else if ( Number.isInteger(waitTime) ) {
        return waitTime+" "+t('分鐘')
      } else {
        return eta.remark[i18n.language]
      }
    }
  }

  return (
    <ListItemText
      primary={<Typography component="h5" color="textPrimary">{etas ? getEtaString(etas[0]) : ''}</Typography>}
      secondary={<Typography component="h6" color="textSecondary" className={"etas-secondaryEta"}>{etas ? getEtaString(etas[1]) : ''}</Typography>}
      className={"etas-routeEta"}
    />
  )
}

const DefaultRoute = { co: [''], stops: {'': ['']}, dest: {zh: '', en: ''}, bound: '', nlbId: 0, fares: [], faresHoliday: [] }

export default Etas

const useStyles = makeStyles(theme => ({
  "@global": {
    ".etas-routeEta": {
      width: '20%',
      paddingLeft: '10px',
      textAlign: 'right',
    },
    ".etas-secondaryEta": {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.43'
}
  }
}))
