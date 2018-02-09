'use strict';
var confirm = require('./..');
var PluginError = require('plugin-error');
var readlineSync = require('readline-sync');
var through = require('through2');
var vs = require('vinyl-string');
var map = require('map-stream');
var sinon = require('sinon');

function runConfirm( options ){
  return new Promise( function( res, rej ) {
    vs( 'test', { path: 'test' } )
      .pipe( confirm( options ) )
      .on( 'error', rej )
      .pipe( map( function( file, enc, cb ) {
        cb( null, file );
      } ) )
      .on( 'end', res )
    ;
  } );
}

describe( 'confirm', function(){

  var sandbox = sinon.sandbox.create();

  afterEach( function (){
    sandbox.restore();
  } );


  it( 'throws exception if question callback fails with error', function() {

    expect.assertions( 1 );

    return runConfirm( {
        question: function(){ throw new Error( 'something bad happened' ) }
    } )
    .catch( function( e ) {
        expect( e ).toBeInstanceOf( PluginError );
    } );
  } );

  it( 'throws exception if proceed callback fails with error', function() {

    sandbox.stub( readlineSync, 'question' ).returns( 'answer' );

    expect.assertions( 1 );

    return runConfirm( {
      question: 'what\'s up?',
      proceed: function(){ throw new Error( 'something bad happened' ) }
    } )
    .catch( function( e ) {
        expect( e ).toBeInstanceOf( PluginError );
    } );

  } );

  it( 'logs if task is aborted', function() {

    var stdout = [];
    sandbox.stub( readlineSync, 'question' ).returns( false );
    sandbox.stub( process.stdout, 'write' ).callsFake( function( output ) { stdout.push( output ); } );
    return runConfirm( {
      question: 'what\'s up?',
      proceed: false
    } )
    .then( function() {
      expect( stdout ).toEqual( expect.arrayContaining( [ expect.stringContaining( 'Tasks are aborted.' ) ] ) );
    } );

  } );

} );
