import React, {useRef} from 'react';
import { NextRouter, useRouter } from "next/router";
import { ApolloQueryResult, useQuery } from "@apollo/client";
import { useDispatch } from 'react-redux';
import { Button } from "@material-ui/core";
import { ArrowDownwardRounded } from "@material-ui/icons";
import { modifyAppTabs } from "../reducers/AppNavReducer";
import { GET_CONTENTS } from "../graphQL/quries";
import { Loading, SimpleContCard } from "../components";
import { ContentDetails } from "../types";
import useIntersectionObserver from "../hooks/useIntersectionObserver";
import Notiflix from 'notiflix';

type Props = {

}

type HubScrollViewState = {
    contents: ContentDetails[],
    totalElements: number,
    hasMore: boolean
    loading: boolean
}

const HubContainer: React.FunctionComponent<Props> = ({ }) => {
    const router: NextRouter = useRouter();
    const dispatch = useDispatch();

    const [ scrollViewState, setScrollViewState ] = React.useState<HubScrollViewState>({
        contents: [],
        totalElements: 0,
        hasMore: false,
        loading: false
    });

    // instance variable
    const renderItem: number = 4;
    const currentPage: React.MutableRefObject<number> = useRef(1);
    const totalPage: React.MutableRefObject<number> = useRef(0);
    const rootRef = useRef<HTMLDivElement | undefined>(undefined);
    const targetRef = useRef<HTMLDivElement | undefined>(undefined);

    // const [ page, setPage ] = React.useState<number>(1);
    useIntersectionObserver({
        root: rootRef.current,
        target: targetRef.current,
        onIntersect: async ([{ isIntersecting }]) => {
            if (isIntersecting && !scrollViewState.loading && scrollViewState.hasMore && currentPage.current + 1 <= totalPage.current) {
                Notiflix.Loading.Dots('Fetching more contents...');
                setScrollViewState({ ...scrollViewState, loading: true })
                refetch({ category: -1, pr: { page: currentPage.current + 1, renderItem }})
                    .then((response: ApolloQueryResult<any>) => {
                        if (response && response.data && response.data.allContents) {
                            let added: ContentDetails[] = [ ...scrollViewState.contents, ...response.data.allContents.contents ];
                            setScrollViewState({
                                contents: added,
                                totalElements: response.data.allContents.totalElements,
                                hasMore: added.length < response.data.allContents.totalElements,
                                loading: false
                            })
                            totalPage.current = Math.ceil(response.data.allContents.totalElements / renderItem)
                            currentPage.current = currentPage.current + 1;
                        }
                    });
                Notiflix.Loading.Remove(1000);
            }
        }
    });

    const { refetch } = useQuery(GET_CONTENTS, { variables: { category: -1, pr: { page: currentPage.current, renderItem } },
        onCompleted: response => {
        if (response.allContents) {
            let added: ContentDetails[] = [ ...scrollViewState.contents, ...response.allContents.contents ];
            setScrollViewState({
                contents: added,
                totalElements: response.allContents.totalElements,
                hasMore: added.length < response.allContents.totalElements,
                loading: false
            })
            totalPage.current = Math.ceil(response.allContents.totalElements / renderItem);
        }}, fetchPolicy: "network-only" })

    return (
        <div style={{ width: '100%' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8pt' }}>
                <Button style={{ background: '#FFE94A 0% 0% no-repeat padding-box'}}
                        onClick={async () => { await new Promise((resolve) => { dispatch(modifyAppTabs(3)); resolve(true); })
                            .then(() => router.push('/?tb=3').then()) }}>
                    <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '12pt' }}>
                        컨텐츠 만들기
                    </span>
                </Button>
            </div>
            <div ref={rootRef} style={{ paddingLeft: '16pt', height: '530pt', display: 'flex', flexWrap: 'wrap', overflow: 'scroll',
                border: 0, boxShadow: '0px 3px 6px #00000029', borderRadius: '12pt' }}>
                {
                    scrollViewState.contents.map((cont: ContentDetails) => (
                        <SimpleContCard key={cont.id + Math.random()} details={cont} />
                    ))
                }
                {
                    scrollViewState.hasMore &&
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <ArrowDownwardRounded />
                            <span>
                                Scroll Down
                            </span>
                        </div>
                }
                {
                    scrollViewState.loading && <Loading />
                }
                <div ref={targetRef} />
            </div>
        </div>
    )
}

export default HubContainer;