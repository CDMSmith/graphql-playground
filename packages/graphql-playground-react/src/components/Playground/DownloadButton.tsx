/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as React from 'react'
import { styled } from '../../styled'
import { connect } from 'react-redux'
import { runQuery, stopQuery } from '../../state/sessions/actions'
import { createStructuredSelector } from 'reselect'
import {
  getQueryRunning,
  getOperations,
  getSelectedSessionIdFromRoot,
  getResponses
} from '../../state/sessions/selectors'
import { toJS } from './util/toJS'
import { Parser } from 'json2csv'
import { List } from 'immutable'
import { ResponseRecord } from '../../state/sessions/reducers'

export interface ReduxProps {
  runQuery: (operationName?: string) => void
  stopQuery: (sessionId: string) => void
  queryRunning: boolean
  operations: any[]
  sessionId: string
  responses: List<ResponseRecord>
}

export interface State {
  optionsOpen: boolean
  highlight: any
}

/**
 * DownloadButton
 *
 * What a nice round shiny button. Shows a drop-down when there are multiple
 * queries to run.
 */
class DownloadButton extends React.Component<ReduxProps, State> {
  constructor(props) {
    super(props)

    this.state = {
      optionsOpen: false,
      highlight: null,
    }
  }

  render() {

    let options: any = null

    // Allow click event if there is a running query or if there are not options
    // for which operation to run.
    let onClick = this.onClick;

    const pathJSX = this.props.queryRunning ? (
      <rect fill="#FFFFFF" x="10" y="10" width="13" height="13" rx="1" />
    ) : (
      <path d="M5.016 18h13.969v2.016h-13.969v-2.016zM18.984 9l-6.984 6.984-6.984-6.984h3.984v-6h6v6h3.984z" />
    )

    return (
      <Wrapper>
        <Button
          isRunning={this.props.queryRunning}
          onClick={onClick}
          title="Download Results (csv)"
        >
          <svg
            width="28"
            height="28"
            viewBox={`0,0,24,24`}
          >
            {pathJSX}
          </svg>
        </Button>
        {options}
      </Wrapper>
    )
  }

  private onClick = () => {

    this.props.responses.forEach(response => {      
      const jsonObj = JSON.parse(response.date);
      Object.keys(jsonObj.data).forEach(baseKey => {
        let key = baseKey;
        let joinedKey = key;
        let data = jsonObj.data[joinedKey];
        while(!Array.isArray(data)) {
          joinedKey = Object.keys(data)[0];
          key += '.' + joinedKey;
          data = data[joinedKey];
        }

        const flat = data.map(d => this.flatten(d, null, null));
        
        const parser = new Parser({});
        const csv = parser.parse(flat);

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', `${baseKey}.csv`);
    
        element.style.display = 'none';
        document.body.appendChild(element);
    
        element.click();
    
        document.body.removeChild(element);
      });
    });
  }

  // Yan Foto
  // https://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
  private flatten = (obj, prefix, current) => {
    prefix = prefix || []
    current = current || {}
  
    if(Array.isArray(obj) && obj.length === obj.filter(o => typeof o === "string" || typeof o === "number").length) {
      // join arrayed string, number values
      let joinWith = ', ';
      if(obj.length === 2) {
        joinWith = ' - ';
      }
      
      obj = obj.join(joinWith);
    } else if (Array.isArray(obj) && obj.length === obj.filter(o => typeof o === "object").length) {
      // format to be able to flatten arrays of objects
      // transform from original array to an object with indices as keys
      obj = {...obj};
    }
    
    if (typeof (obj) === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        this.flatten(obj[key], prefix.concat(key), current)
      })
    } else {
      current[prefix.join('.')] = obj
    }
  
    return current
  }
}

const mapStateToProps = createStructuredSelector({
  queryRunning: getQueryRunning,
  operations: getOperations,
  sessionId: getSelectedSessionIdFromRoot,
  responses: getResponses,
})

export default connect(
  mapStateToProps,
  { runQuery, stopQuery },
)(toJS(DownloadButton))

const Wrapper = styled.div`
  position: absolute;
  left: -62px;
  z-index: 5;
  top: 90px;
  margin: 0 14px 0 28px;
`

interface ButtonProps {
  isRunning: boolean
}

const Button = styled<ButtonProps, 'div'>('div')`
  width: 60px;
  height: 60px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 100%;
  transition: background-color 100ms;
  background-color: ${p =>
    p.isRunning
      ? p.theme.editorColours.executeButtonSubscription
      : p.theme.editorColours.executeButton};
  border: 6px solid ${p => p.theme.editorColours.executeButtonBorder};
  cursor: pointer;
  user-select: none;

  svg {
    fill: ${p => (p.theme.mode === 'light' ? 'white' : 'inherit')};
  }

  &:hover {
    background-color: ${p =>
      p.isRunning
        ? p.theme.editorColours.executeButtonSubscriptionHover
        : p.theme.editorColours.executeButtonHover};
  }
`